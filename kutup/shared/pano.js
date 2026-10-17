// Two Pano easter eggs, shared by the page (the hush toast, the tea time) and
// the server (the "Şşşt!" and "Çay saati" badges, n14).
/** A Pano message that is all shouting: three letters or more, and no lower case. */
export const shouting = (text) => {
  const said = String(text || "");
  return /\p{L}{3}/u.test(said) && said === said.toLocaleUpperCase("tr") && said !== said.toLocaleLowerCase("tr");
};
/** A Pano message that is just "çay". */
export const teaCall = (text) => String(text || "").trim().toLocaleLowerCase("tr") === "çay";
