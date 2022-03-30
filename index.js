import axios from "axios";
import cheerio from "cheerio";
import express from "express";
import cors from "cors";
import fs from "fs";
import { MongoClient } from "mongodb";
import { createConnection } from "net";
import dotenv from "dotenv";
dotenv.config();

console.log(process.env.MONGO_URL);
const PORT = process.env.PORT;
const app = express();

const url =
  "https://www.flipkart.com/search?q=mobiles&p%5B%5D=facets.discount_range_v1%255B%255D%3D40%2525%2Bor%2Bmore&p%5B%5D=facets.rating%255B%255D%3D4%25E2%2598%2585%2B%2526%2Babove&p%5B%5D=facets.battery_capacity%255B%255D%3D4000%2B-%2B4999%2BmAh&p%5B%5D=facets.ram%255B%255D%3D4%2BGB";

axios.get(url).then((response) => {
  let $ = cheerio.load(response.data);
  const product = [];

  $("div._1AtVbE > div._13oc-S > div >div._2kHMtA").each(function (index) {
    const imageUrl = $(this).find("div.CXW8mj >img").attr("src");
    const title = $(this).find("div._3pLy-c>div.col-7-12 > div._4rR01T").text();
    const rating = $(this)
      .find("div.gUuXy- > span._1lRcqv > div._3LWZlK")
      .text();
    const price = $(this).find("div._25b18c > div._3I9_wc ").text();
    const offerPrice = $(this).find("div._25b18c > div._30jeq3").text();
    const offer = $(this).find("div._25b18c > div._3Ay6Sb > span").text();

    product.push({
      title: title,
      imageUrl: imageUrl,
      rating: rating,
      price: price,
      offerPrice: offerPrice,
      offer: offer,
    });
    console.log(product);

    fs.writeFile("./products.json", JSON.stringify(product), (err) => {
      if (err) {
        console.log("err");
      } else {
        console.log("Done writing");
      }
    });
  });
});


app.use(cors());
app.use(express.json());

//const MONGO_URL = "mongodb://localhost";

const MONGO_URL = process.env.MONGO_URL;

async function Connection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("mongo is connected");
  return client;
}
const client = await Connection();

app.get("/", async function (request, response) {
  response.send("hello node");
});

app.get("/mobile", async function (request, response) {
  const result = await client
    .db("mobile")
    .collection("mobileproduct")
    .find({})
    .toArray();
  response.send(result);
});

app.get("/mobile/:id", async function (request, response) {
  console.log(request.params);
  const { id } = request.params;
  const mob = await client
    .db("mobile")
    .collection("mobileproduct")
    .findOne({ id: id });
  response.send(mob);
});

app.post("/mobile", async function (request, response) {
  const data = request.body;
  console.log(data);
  const post = await client
    .db("mobile")
    .collection("mobileproduct")
    .insertMany(data);
  response.send(post);
});

app.delete("/mobile/:id", async function (request, response) {
  console.log(request.params);
  const { id } = request.params;
  const del = await client
    .db("mobile")
    .collection("mobileproduct")
    .deleteOne({ id: id });
  response.send(del);
});

app.put("/mobile/:id", async function (request, response) {
  console.log(request.params);
  const { id } = request.params;
  const updateData = request.body;
  const del = await client
    .db("mobile")
    .collection("mobileproduct")
    .updateOne({ id: id }, { $set: updateData });
  response.send(del);
});

app.listen(PORT, () => console.log(`server started in ${PORT}`));
