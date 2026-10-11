const fs = require("fs");
const path = require("path");
const { devDependencies } = require("../package.json");

const backendRoot = path.join(__dirname, "..");

const listFiles = (target) => {
  const full = path.join(backendRoot, target);
  if (fs.statSync(full).isFile()) return [full];

  return fs.readdirSync(full, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(target, entry.name);
    return entry.isDirectory()
      ? listFiles(child)
      : [path.join(backendRoot, child)];
  });
};

describe("production code", () => {
  it("does not load development dependencies", () => {
    const files = ["app", "app.js", "server.js"]
      .flatMap(listFiles)
      .filter((file) => file.endsWith(".js"));

    expect(files.length).toBeGreaterThan(10);

    const offenders = [];
    for (const file of files) {
      const source = fs.readFileSync(file, "utf8");
      for (const name of Object.keys(devDependencies)) {
        const pattern = new RegExp(`require\\(["']${name}(/|["'])`);
        if (pattern.test(source)) {
          offenders.push(
            `${path.relative(backendRoot, file)} requires ${name}`,
          );
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
