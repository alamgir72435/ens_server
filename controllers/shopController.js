const fs = require('fs').promises
const cloudinary = require('cloudinary')
const catchAsyncError = require('../middleware/catchAsyncError')

const Shop = require('../models/shopModel')
// const User = require("../models/userModel");
const ErrorHandler = require('../utils/errorhander')

exports.registerShop = catchAsyncError(async (req, res, next) => {

  const getShop = await Shop.findOne({ createdBy: req.user.id })
  if (getShop) {
    return next(new ErrorHandler('Shop Alredy Exist ! You can create one shop'))
  }

  req.body.createdBy = req.user.id
  req.body.userId = req.user.id

  if (req.files && req.files.banner) {
    const tempFilePath = `temp1_${Date.now()}.jpg`
    await fs.writeFile(tempFilePath, req.files.banner.data)

    const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
      folder: 'shopBanners',
      crop: 'scale',
    })

    req.body.banner = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    }

    await fs.unlink(tempFilePath)
  }

  if(!req.files.logo || req.files.logo === 'undefined'){
    return next(new ErrorHandler('Logo not found', 404))
  }

  if (req.files && req.files.logo) {
    const tempFilePath1 = `temp1_${Date.now()}.jpg`
    await fs.writeFile(tempFilePath1, req.files.logo.data)

    const myCloudForlogo = await cloudinary.v2.uploader.upload(tempFilePath1, {
      folder: 'shopLogos',
      crop: 'scale',
    })
    req.body.logo = {
      public_id: myCloudForlogo.public_id,
      url: myCloudForlogo.secure_url,
    }
    await fs.unlink(tempFilePath1)
  }

  const shop = await Shop.create(req.body)
  res.status(200).json({ success: true, data:shop })
})

exports.updateShopProfile = catchAsyncError(async (req, res) => {
  const shop = await Shop.findById(req.shop._id);

  // check if shop lat and long
  if (req.body.latitude && req.body.longitude) {
    req.body.location = {
      type: 'Point',
      coordinates: [req.body.longitude, req.body.latitude],
    };
  }

  if (req.files && req.files.banner) {
    const bannerImageId = shop.banner.public_id;
    await cloudinary.v2.uploader.destroy(bannerImageId);
    const tempFilePath = `temp1_${Date.now()}.jpg`;
    await fs.writeFile(tempFilePath, req.files.banner.data);

    // Upload the new banner image to Cloudinary
    const myCloud = await cloudinary.v2.uploader.upload(req.files.banner.path, {
      folder: 'shopBanners',
      crop: 'scale',
    });

    req.body.banner = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };

    await fs.unlink(tempFilePath);
    
  }

  if (req.files && req.files.logo) {
    const logoImageId = shop.logo.public_id;
    await cloudinary.v2.uploader.destroy(logoImageId);
    const tempFilePath1 = `temp1_${Date.now()}.jpg`;
    await fs.writeFile(tempFilePath1, req.files.logo.data);

    const myCloudForlogo = await cloudinary.v2.uploader.upload(tempFilePath1, {
      folder: 'shopLogos',
      crop: 'scale',
    });
    req.body.logo = {
      public_id: myCloudForlogo.public_id,
      url: myCloudForlogo.secure_url,
    };
    await fs.unlink(tempFilePath1);
  }

  // Update shop details except the banner
  const updatedShop = await Shop.findByIdAndUpdate(shop._id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  // Return updated shop
  res.status(201).json({ success: true, data:updatedShop });
});


exports.updateShopLocation = catchAsyncError(async (req, res, next) => {
  const { latitude, longitude } = req.body
  const shop = await Shop.findById(req.shop.id)

  if (!shop) {
    return next(new ErrorHandler('Shop not found', 404))
  }

 // Check if latitude and longitude are provided in the request body
  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'Latitude and longitude are required.' });
  }

  const longitudeValue = parseFloat(longitude);
  const latitudeValue = parseFloat(latitude);

  // Validate latitude and longitude
  if (isNaN(latitudeValue) || isNaN(longitudeValue) || latitudeValue < -90 || latitudeValue > 90 || longitudeValue < -180 || longitudeValue > 180) {
    return res.status(400).json({ success: false, message: 'Invalid latitude or longitude values.' });
  }

  // Update location coordinates
  shop.location = {
    type: 'Point',
    coordinates: [longitudeValue, latitudeValue],
  };

  // Save the updated shop with new location coordinates
  await shop.save();

  res.status(200).json({ success: true, message: 'Update successfully.' });

})

exports.getShopDetails = catchAsyncError(async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if(!shop){
      return next(new ErrorHandler('Shop not found', 404))
    }
      res.status(200).json({ success: true, data: shop })
    }
  catch(error){
    next(error)
  }
})

exports.getShopDetailsByShopKeeper = catchAsyncError(async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.shop._id);

    if(!shop){
      return next(new ErrorHandler('Shop not found', 404))
    }
      res.status(200).json({ success: true, data: shop })
    }
  catch(error){
    next(error)
  }
})

exports.deleteShop = catchAsyncError(async (req, res, next) => {
  const shop = await Shop.findById(req.params.id)

  if (!shop) {
    return next(
      new ErrorHandler(`Shop doesn't exist with Name: ${req.params.name}`, 400),
    )
  }

  await shop.deleteOne()
  res.status(200).json({ success: true, message: 'Shop Deleted Successfully' })
})

exports.getNearbyShops = catchAsyncError(async (req, res, next) => {
  const longitude = parseFloat(req.query.longitude)
  const latitude = parseFloat(req.query.latitude)

  if (isNaN(longitude) || isNaN(latitude)) {
    return res
      .status(400)
      .json({ success: false, message: 'Invalid coordinates' })
  }

  const shops = await Shop.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        distanceField: 'distance',
        maxDistance: 5000, // 5km in meters
        spherical: true,
      },
    },
    { $sort: { distance: 1 } },
  ])
  if (!shops) {
    return next(new ErrorHandler('No Shops are available in your area', 404))
  }
  res.status(200).json({ success: true, data: shops })
})

exports.getAllShops = catchAsyncError(async (_, res) => {
  const shops = await Shop.find()
  res.status(200).json({ success: true, shops })
})

exports.updateShopStatus = catchAsyncError(async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);

  if(!shop){
    return next(new ErrorHandler('Shop not found', 404))
  }

  // Update shop details except the banner
  const updatedShop = await Shop.findByIdAndUpdate(shop._id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  // Return updated shop
  res.status(201).json({ success: true, data:updatedShop });
  } catch (error) {
    next(error)
  }
})