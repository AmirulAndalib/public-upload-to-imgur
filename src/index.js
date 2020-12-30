const core = require('@actions/core')
const axios = require('axios')
const fs = require('fs')
const search = require("./search")

main().catch(err => {
    core.setFailed(err);
  })

async function main() {
  const description = core.getInput("description")
  const clientId = core.getInput("client_id")
  const result = await search.findFilesToUpload(
    core.getInput('path')
  )
  const img_paths = result.filesToUpload

  console.log("Found these images: \n", img_paths.join("\n"))
  if (!img_paths) {
    console.log("No image paths found. Skipping upload and exiting script.")
    return;
  }

  console.log("Uploading images...")
  let links = await Promise.all(
    img_paths.map(img_path => {
      return uploadToImgur(img_path, description, clientId)
    })
  )
  console.log(links);
  core.setOutput("imgur_urls", JSON.stringify(links))
  console.log("Script finished.")
}

function uploadToImgur(img_path, description, clientId) {
  const axiosConfig = {
    method: "post",
    url: "https://api.imgur.com/3/image",
    headers: {
      "Authorization": `Client-ID ${clientId}`
    },
    data: {
      image: fs.readFileSync(img_path, "base64"),
      type: "base64",
      description
    }
  }

  return axios(axiosConfig)
    .then(res => res.data)
    .then(res => {
      if (!res.success) {
        throw new Error(`Request failed. Status code: ${res.status}. Error: ${res.data.error}`)
      }
      console.log("Request successful. Image URL is at: " + res.data.link)
      return res.data.link
    })
    .catch(err => {throw err})
}