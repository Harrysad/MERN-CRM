const path = require("path");
const request = require("supertest");
const SwaggerParser = require("@apidevtools/swagger-parser");
const app = require("../../../app");

const SPEC_PATH = path.join(__dirname, "../../../openapi.yaml");
const METHODS = ["get", "post", "put", "delete"];

const joinPaths = (prefix, route) =>
  (prefix + (route === "/" ? "" : route)).replace(/\/+/g, "/") || "/";

const listRoutes = (stack, prefix = "") =>
  stack.flatMap((layer) => {
    if (layer.route) {
      return Object.keys(layer.route.methods).map(
        (method) =>
          `${method.toUpperCase()} ${joinPaths(prefix, layer.route.path)}`,
      );
    }
    if (layer.name === "router") {
      const mount = layer.regexp.source
        .replace("^\\/", "/")
        .replace("\\/?(?=\\/|$)", "")
        .replace(/\\\//g, "/");
      return listRoutes(layer.handle.stack, joinPaths(prefix, mount));
    }
    return [];
  });

describe("OpenAPI specification", () => {
  it("is a valid OpenAPI document", async () => {
    await expect(SwaggerParser.validate(SPEC_PATH)).resolves.toBeDefined();
  });

  it("documents every route of the API and nothing else", async () => {
    const spec = await SwaggerParser.parse(SPEC_PATH);

    const documented = Object.entries(spec.paths).flatMap(
      ([route, operations]) =>
        Object.keys(operations)
          .filter((method) => METHODS.includes(method))
          .map((method) => `${method.toUpperCase()} ${route}`),
    );
    const registered = listRoutes(app._router.stack).map((route) =>
      route.replace(/:(\w+)/g, "{$1}"),
    );

    expect(documented.sort()).toEqual(registered.sort());
  });

  it("is served as JSON", async () => {
    const res = await request(app).get("/openapi.json");

    expect(res.statusCode).toBe(200);
    expect(res.body.info.title).toBe("MERN CRM API");
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(10);
  });

  it("sends Swagger UI requests to the host that serves the page", async () => {
    const spec = await SwaggerParser.parse(SPEC_PATH);

    expect(spec.servers[0].url).toBe("/");
  });
});

describe("Swagger UI", () => {
  it("is served at /docs", async () => {
    const res = await request(app).get("/docs/");

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });

  it("drops the content security policy only for the documentation", async () => {
    const docs = await request(app).get("/docs/");
    const other = await request(app).post("/auth/logout");

    expect(docs.headers["content-security-policy"]).toBeUndefined();
    expect(other.headers["content-security-policy"]).toBeDefined();
  });
});
