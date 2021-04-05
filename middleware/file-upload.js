const multer = require('multer')
const multerS3 = require('multer-s3-transform')
const aws = require('aws-sdk')
const sharp = require('sharp')

const { v1: uuidv1 } = require('uuid')

const MIME_TYPE_MAP = {
  'image/png': 'png',
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg',
};

aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accsessKeyId: process.env.AWS_ACCESS_KEY_ID,
  region: process.env.AWS_REGION
})

const s3 = new aws.S3()

const fileUpload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKED_NAME,
    acl: 'public-read',

    shouldTransform: (req, file, cb) => {
      cb(null, /^image/i.test(file.mimetype))
      // cb(null, { fildName: file.fieldname })
    },
    transforms: [{
      id: 'original',
      key: (req, file, cb) => {
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, uuidv1() + '.' + ext)
      },
      transform: function (req, file, cb) {
        cb(null, sharp().resize(896,672))
        console.log(file.data)
      }
    }]
  }),
  fileFilter: (req, file, cb) => {
    const isValid = !!MIME_TYPE_MAP[file.mimetype];
    let error = isValid ? null : new Error('Invalid mime type!')
    cb(error, isValid)
  }
})

// const fileUpload = multer({
//   limits: 500000,
//   storage: multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads/images')
//     },
//     filename: (req, file, cb) => {
//       const ext = MIME_TYPE_MAP[file.mimetype];
//       cb(null, uuidv1() + '.' + ext)
//     }
//   }),
//   fileFilter: (req, file, cb) => {
//     const isValid = !!MIME_TYPE_MAP[file.mimetype];
//     let error = isValid ? null : new Error('invalid mime type!')
//     cb(error, isValid)
//   }
// })

module.exports = fileUpload