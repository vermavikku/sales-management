const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
  {
    product_code: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    totalStock: {
      type: Number,
      required: true,
      min: 0,
    },
    remainStock: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Composite unique index (product_code + date)
stockSchema.index({ product_code: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Stock", stockSchema);
