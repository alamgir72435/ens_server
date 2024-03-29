const fs = require('fs').promises
const cloudinary = require('cloudinary')
const catchAsyncError = require('../middleware/catchAsyncError')
const ShopCategory = require('../models/shopCategoryModel')
const ApiFeatures = require('../utils/apifeature')
const ErrorHandler = require('../utils/errorhander')
const shopModel = require('../models/shopModel')

exports.createShopCategory = catchAsyncError(async (req, res, next) => {
  const exist = await ShopCategory.findOne({ name: req.body.name })
  if (exist) {
    return next(new ErrorHandler(`${req.body.name} is already exist.`))
  }

  if (req.files && req.files.image) {
    const tempFilePath = `temp_${Date.now()}.jpg`
    await fs.writeFile(tempFilePath, req.files.image.data)

    const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
      folder: 'shopCategories',
      width: 150,
      crop: 'scale',
    })

    req.body.image = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    }
    await fs.unlink(tempFilePath)
  }

  const shopCategory = await ShopCategory.create(req.body)
  if (!shopCategory) {
    return next(new ErrorHandler('shop category is not created.'), 404)
  }
  const shopCategoryWithout__v = shopCategory.toObject()
  delete shopCategoryWithout__v.__v

  res.status(201).json({ success: true, data: shopCategoryWithout__v })
})

exports.updateShopCategory = catchAsyncError(async (req, res, next) => {
  const exist = await ShopCategory.findOne({ name: req.body.name })
  if (exist) {
    return next(new ErrorHandler(`${req.body.name} is already exist.`))
  }

  let shopCategory = await ShopCategory.findById(req.params.id)

  if (!shopCategory) {
    return next(new ErrorHandler('shop category not found', 404))
  }

  if (req.files && req.files.image) {
    const imageId = shopCategory.image.public_id
    const tempFilePath = `temp_${Date.now()}.jpg`
    await fs.writeFile(tempFilePath, req.files.image.data)
    await cloudinary.v2.uploader.destroy(imageId)

    const myCloud = await cloudinary.v2.uploader.upload(tempFilePath, {
      folder: 'shopCategories',
      width: 150,
      crop: 'scale',
    })

    req.body.image = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    }
    await fs.unlink(tempFilePath)
  }

  shopCategory = await ShopCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })

  const shopCategoryWithout__v = shopCategory.toObject()
  delete shopCategoryWithout__v.__v

  res.status(200).json({ success: true, data: shopCategoryWithout__v })
})

exports.deleteShopCategory = catchAsyncError(async (req, res, next) => {
  const deleteShopCategory = await ShopCategory.findById(req.params.id);

  if (!deleteShopCategory) {
    return next(new ErrorHandler('Shop category not found', 404));
  }

  const shopUsingCategory = await shopModel.findOne({ category: req.params.id });

  if (shopUsingCategory) {
    return next(new ErrorHandler('Already in use by a shop', 400));
  }

  await ShopCategory.deleteOne({ _id: req.params.id });

  res.status(200).json({ success: true, message: 'Shop category deleted successfully' });
});


exports.getAllShopCategories = catchAsyncError(async (req, res) => {
  let resultPerPage = 10;  

  if (req.query.limit) {
    resultPerPage = parseInt(req.query.limit);
  }
  const shopCategoryCount = await ShopCategory.countDocuments({})
  const apiFeature = new ApiFeatures(ShopCategory.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage)

  let shopCategories = await apiFeature.query

   if (!shopCategories || shopCategories.length === 0) {
    return res.status(200).json({
      success: true,
      shopCategoryCount: 0,
      resultPerPage,
      filteredShopCategoriesCount: 0,
      shopCategories: []
    });
  }

  let filteredShopCategoriesCount = shopCategories.length

  res.status(200).json({
    success: true,
    shopCategoryCount,
    resultPerPage,
    filteredShopCategoriesCount,
    shopCategories,
  })
})
