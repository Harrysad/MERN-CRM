export const formatZipCode = (code) => {
  const digitOnly = code.replace(/\D/g, "");

  if (!digitOnly.length) return "";

  if (digitOnly.length <= 2) return digitOnly;

  return `${digitOnly.slice(0, 2)}-${digitOnly.slice(2, 5)}`;
};

export const extractCodeNumbers = (code) => {
  return `${code.replace(/\D/g, "")}`;
};

export const formatNipCode = (code) => {
  const digitOnly = code.replace(/\D/g, "");

  if (!digitOnly.length) return "";

  if (digitOnly.length <= 3) return digitOnly;
  if (digitOnly.length <= 6)
    return `${digitOnly.slice(0, 3)}-${digitOnly.slice(3)}`;
  if (digitOnly.length <= 8)
    return `${digitOnly.slice(0, 3)}-${digitOnly.slice(3, 6)}-${digitOnly.slice(
      6,
      8,
    )}`;

  return `${digitOnly.slice(0, 3)}-${digitOnly.slice(3, 6)}-${digitOnly.slice(
    6,
    8,
  )}-${digitOnly.slice(8, 10)}`;
};

export const setCookie = (user) => {
  var now = new Date();
  var time = now.getTime();
  var expireTime = time + 1000 * 36000;
  now.setTime(expireTime);
  document.cookie = `user=${encodeURIComponent(
    JSON.stringify(user),
  )};expires=${now.toUTCString()};`;
};

export const getCookie = (cname) => {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
};

export const getWriteBlockMessage = (isViewer, isVerified) => {
  if (isViewer) {
    return "Konto demo jest tylko do odczytu - możesz przeglądać i testować formularze, ale żadne zmiany nie zostaną zapisane.";
  }
  if (!isVerified) {
    return "Potwierdź adres e-mail, aby móc zapisywać zmiany. Sprawdź swoją skrzynkę pocztową.";
  }
  return null;
};

const TOO_MANY_REQUESTS_MESSAGE =
  "Zbyt wiele prób. Spróbuj ponownie za kilka minut.";

export const getSignupErrorMessage = (error) => {
  if (error?.response?.status === 429) {
    return TOO_MANY_REQUESTS_MESSAGE;
  }
  if (error?.response?.status === 409) {
    return "Konto z tym adresem e-mail już istnieje.";
  }
  if (error?.response?.status === 400) {
    return "Sprawdź poprawność danych. Hasło musi mieć co najmniej 8 znaków.";
  }
  return "Nie udało się założyć konta. Spróbuj ponownie później.";
};

export const getLoginErrorMessage = (error) => {
  if (error?.response?.status === 429) {
    return TOO_MANY_REQUESTS_MESSAGE;
  }
  if (error?.response?.status === 400) {
    return "Nieprawidłowy e-mail lub hasło.";
  }
  return "Nie udało się zalogować. Spróbuj ponownie później.";
};

export const deleteCookie = (cname) => {
  document.cookie = cname + "=;Expires=Thu, 01 Jan 1970 00:00:01 GMT;";
};
