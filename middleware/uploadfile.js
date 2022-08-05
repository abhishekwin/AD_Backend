// const multer = require('multer');

// const multerStorage = multer.memoryStorage();

// const multerFilter = (_, file, cb) => {
//   if (file?.mimetype?.startsWith('image')) {
//     cb(null, true);
//   } else {
//     cb(new BadRequestException(ErrorMessage.ONLY_IMAGES_ALLOWED), false);
//   }
// };

// const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

// const uploadUserPhoto = upload.single('photo');

// module.exports = { uploadUserPhoto };