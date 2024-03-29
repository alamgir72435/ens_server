const express = require('express')

const { isAuthenticated, isAuthorizeRoles } = require('../middleware/auth')

const {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsByShop,
  getAllProductsByUser,
  adminGetAllProductsByShop,
  getSingleProduct,
  getAllProducts,
  productSearch,
  updateProductStatus,
  createProductByAdmin,
  getProductsByCategory,
  getProductsByBrand,
  getPrductsByShopID,
  getAllProductsByAdmin,
} = require('../controllers/productController')

const router = express.Router()

//get all products
router
  .route('/get/products')
  .get(getAllProducts)

router
  .route('/get/products/admin')
  .get(getAllProductsByAdmin)


//get all products by shop//
router
  .route('/shopkeeper/shop/products')
  .get(isAuthenticated, getAllProductsByShop)

router
  .route('/admin/products/shop/:id')
  .get(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), adminGetAllProductsByShop)

router
  .route('/user/products/shop/:id')
  .get(isAuthenticated, getAllProductsByUser)

router
  .route('/shop/product/new')
  .post(isAuthenticated, isAuthorizeRoles('shop_keeper'), createProduct)

router
  .route('/shop/admin/product/new')
  .post(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), createProductByAdmin)

router
  .route('/shop/product/:id')
  .get(getSingleProduct)
  .put(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), updateProduct)
  .delete(isAuthenticated, isAuthorizeRoles('shop_keeper', 'admin', 'super_admin'), deleteProduct)

router.route('/product/search').get(productSearch)

router
  .route('/admin/product/status/:id')
  .put(isAuthenticated, isAuthorizeRoles('admin', 'super_admin'), updateProductStatus)

router
  .route('/products/category/:id')
  .get(isAuthenticated, getProductsByCategory)

router
  .route('/products/brand/:id')
  .get(isAuthenticated, getProductsByBrand)

router
  .route('/shop/products/:id')
  .get(getPrductsByShopID)


module.exports = router
