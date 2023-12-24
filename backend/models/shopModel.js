const mongoose = require("mongoose");
const validator = require("validator");

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter Shop Name"],
    maxLength: [30, "Name cna not excced 30 charaters"],
    minLength: [2, "Name should have more then 2 characters long"],
  },
  info: {
    type: String,
  },
  logo: {
    public_id: {
      type: String,
      default: "This is Sample Id",
    },
    url: {
      type: String,
      default: "This is sample URL",
    },
  },
  banner: [
    {
      public_id: {
        type: String,
        required: true,
        default: "This is Sample Id",
      },
      url: {
        type: String,
        default: "This is sample URL",
      },
    },
  ],
  category: {
    type: String,
    required: [true, "Enter a Category of your Shop"],
  },
  address: {
    type: String,
    required: [true, "Enter a Address of your Shop"],
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: 300 },
  },
});

module.exports = mongoose.model("shop", shopSchema);
