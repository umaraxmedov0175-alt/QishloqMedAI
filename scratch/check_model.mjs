import fs from "node:fs";

const path = "./public/models/Male.OBJ";
console.log("Checking path:", path);

if (fs.existsSync(path)) {
  const stat = fs.statSync(path);
  console.log("File size in bytes:", stat.size);
  const head = fs.readFileSync(path, "utf-8").slice(0, 500);
  console.log("Header snippet:\n", head);
} else {
  console.log("File does NOT exist at path:", path);
}
