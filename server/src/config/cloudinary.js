const { v2: cloudinary } = require('cloudinary');

function configureCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    return false;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return true;
}

function categoryConfig(category) {
  const configs = {
    vocabulary_image: { folder: 'englishhub/vocabulary', resourceType: 'image' },
    avatar: { folder: 'englishhub/avatars', resourceType: 'image' },
    listening_audio: { folder: 'englishhub/listening-audio', resourceType: 'video' },
    learning_document: { folder: 'englishhub/documents', resourceType: 'raw' },
  };

  return configs[category] || configs.vocabulary_image;
}

function createUploadSignature(category = 'vocabulary_image', publicId) {
  if (!configureCloudinary()) {
    return null;
  }

  const timestamp = Math.round(Date.now() / 1000);
  const config = categoryConfig(category);
  const paramsToSign = {
    folder: config.folder,
    timestamp,
  };

  if (publicId) {
    paramsToSign.public_id = publicId;
  }

  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

  return {
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    folder: config.folder,
    publicId: publicId || null,
    resourceType: config.resourceType,
    signature,
    timestamp,
    uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${config.resourceType}/upload`,
  };
}

module.exports = {
  createUploadSignature,
};
