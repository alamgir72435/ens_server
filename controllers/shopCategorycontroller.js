const catchAsyncError = require('../middleware/catchAsyncError')
const ShopCategory = require('../models/shopCategoryModel')
const ApiFeatures = require('../utils/apifeature')
const ErrorHandler = require('../utils/errorhander')

exports.createShopCategory = catchAsyncError(async (req, res, next) => {
  const exist = await ShopCategory.findOne({ name: req.body.name })
  if (exist) {
    return next(new ErrorHandler(`${req.body.name} is already exist.`))
  }

  const shopCategory = await ShopCategory.create(req.body)
  if (!shopCategory) {
    return next(new ErrorHandler('shop category is not created.'), 404)
  }
  const shopCategoryWithout__v = shopCategory.toObject()
  delete shopCategoryWithout__v.__v

  res.status(201).json({ success: true, category: shopCategoryWithout__v })
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

  shopCategory = await ShopCategory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  })

  const shopCategoryWithout__v = shopCategory.toObject()
  delete shopCategoryWithout__v.__v

  res.status(200).json({ success: true, category: shopCategoryWithout__v })
})

exports.deleteShopCategory = catchAsyncError(async (req, res, next) => {
  const deleteShopCategory = await ShopCategory.findById(req.params.id)

  if (!deleteShopCategory) {
    return next(new ErrorHandler('shop category not found', 404))
  }

  await ShopCategory.deleteOne({ _id: req.params.id })

  res
    .status(200)
    .json({ success: true, message: 'shop category deleted sucesfully' })
})

exports.getAllShopCategories = catchAsyncError(async (req, res) => {
  const resultPerPage = 10
  const shopCategoryCount = await ShopCategory.countDocuments({})
  const apiFeature = new ApiFeatures(ShopCategory.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage)

  let shopCategories = await apiFeature.query

  let filteredShopCategoriesCount = shopCategories.length

  res.status(200).json({
    success: true,
    shopCategoryCount,
    resultPerPage,
    filteredShopCategoriesCount,
    shopCategories,
  })
})