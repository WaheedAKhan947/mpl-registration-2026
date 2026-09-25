import mongoose from "mongoose";

export const MAX_AMBASSADOR_IMAGES = 6;

const BrandAmbassadorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    detailsUr: { type: String, trim: true, default: "" },
    // R2 object keys (not URLs) -- signed URLs are generated on read.
    // The public site only shows ambassadors with at least one image.
    images: {
      type: [{ type: String, trim: true }],
      default: [],
      validate: {
        validator: (images) => images.length <= MAX_AMBASSADOR_IMAGES,
        message: `A brand ambassador can have at most ${MAX_AMBASSADOR_IMAGES} images.`,
      },
    },
    // Lower numbers show first on the public site.
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BrandAmbassadorSchema.index({ order: 1, createdAt: 1 });

// A dev server keeps the compiled model cached across hot reloads; rebuild it
// if it was compiled with a different image limit.
if (mongoose.models.BrandAmbassador && mongoose.models.BrandAmbassador.maxImages !== MAX_AMBASSADOR_IMAGES) {
  mongoose.deleteModel("BrandAmbassador");
}

const BrandAmbassador =
  mongoose.models.BrandAmbassador || mongoose.model("BrandAmbassador", BrandAmbassadorSchema);
BrandAmbassador.maxImages = MAX_AMBASSADOR_IMAGES;

export default BrandAmbassador;
