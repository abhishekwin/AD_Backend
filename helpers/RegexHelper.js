async function specialCharacter(text) {
  let str = text;
  // if (/^[[\ ^ $ . | ? * + ( )]*$/.test(text) == true) {
  if (text.length > 0) {
    str = "";
    const stringArray = text.split("");
    stringArray.map((val, key) => {
      if (/^[[\ ^ $ . | ? * + ( )]*$/.test(val) == true) {
        str += `\\${val}`;
      } else {
        str += `${val}`;
      }
    });
  }
  // }
  return str;
}
module.exports = {
  specialCharacter
}
