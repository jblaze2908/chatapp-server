const cloudinary = require("cloudinary");
const consola = require("consola");
const config = require("../config");
const imagemin = require("imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const { default: imageminPngquant } = require("imagemin-pngquant");
const imageminGifsicle = require("imagemin-gifsicle");
const imageminSvgo = require("imagemin-svgo");
const uploadImage = (req) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!req.file) {
        resolve({
          status: 404,
          msg: "file not found",
        });
      }
      const compressedImg = await compressImage(req.file.buffer);
      cloudinary.config({
        cloud_name: config.CLOUDINARY_CLOUD_NAME,
        api_key: config.CLOUDINARY_API_KEY,
        api_secret: config.CLOUDINARY_API_SECRET,
      });
      cloudinary.uploader
        .upload_stream((result) => {
          resolve({ status: 200, link: result.secure_url });
        })
        .end(compressedImg);
    } catch (e) {
      reject({
        status: 500,
        error: e,
      });
    }
  });
};
const compressImage = (fileBuffer) => {
  return new Promise(async (resolve, reject) => {
    try {
      const compressedImg = await imagemin.buffer(fileBuffer, {
        plugins: [
          imageminMozjpeg({ quality: 50 }),
          imageminPngquant({
            quality: [0.3, 0.5],
          }),
          imageminGifsicle(),
          imageminSvgo(),
        ],
      });
      resolve(compressedImg);
    } catch (e) {
      consola.error(new Error(e));
      reject(e);
    }
  });
};
module.exports = uploadImage;
