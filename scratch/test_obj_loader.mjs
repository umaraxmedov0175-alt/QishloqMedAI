import fs from "node:fs";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const path = "./public/models/Male.OBJ";
console.log("Loading OBJ file into memory...");
const fileData = fs.readFileSync(path, "utf-8");
console.log("Read string length:", fileData.length);

const loader = new OBJLoader();
console.log("Parsing OBJ text with Three.js OBJLoader...");
const start = Date.now();
const obj = loader.parse(fileData);
console.log("Parsed in ms:", Date.now() - start);

console.log("Children count in parsed object:", obj.children.length);
obj.traverse((child) => {
  if (child.isMesh) {
    console.log("Found mesh:", child.name, "Geometry vertices count:", child.geometry.attributes.position.count);
    const box = new THREE.Box3().setFromObject(child);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    console.log("Mesh bounds size:", size);
    console.log("Mesh bounds center:", center);
  }
});
