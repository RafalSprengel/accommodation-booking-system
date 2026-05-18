import mongoose, { Schema } from 'mongoose';

interface IPriceTier {
  minGuests: number;
  maxGuests: number;
  price: number;
}

const PriceTierSchema = new Schema(
  {
    minGuests: { type: Number, required: true },
    maxGuests: { type: Number, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const CustomPriceSchema = new Schema(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    prices: { type: [PriceTierSchema], required: true, default: [] },
    extraBedPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

CustomPriceSchema.index({ propertyId: 1, date: 1 }, { unique: true });

export default mongoose.models.CustomPrice ||
  mongoose.model('CustomPrice', CustomPriceSchema);