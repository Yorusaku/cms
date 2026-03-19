import { getMaterialAsyncComponent } from "./materials";

export type LegacyMaterialComponent = NonNullable<
  ReturnType<typeof getMaterialAsyncComponent>
>;

const resolveLegacyMaterialComponent = (
  type: string,
): LegacyMaterialComponent => {
  const component = getMaterialAsyncComponent(type);
  if (!component) {
    throw new Error(`[legacy-components] Unknown material type: ${type}`);
  }
  return component;
};

/**
 * Backward-compatible component exports.
 * Prefer registry-based APIs for new code:
 * - resolveMaterialDefinition
 * - getMaterialAsyncComponent
 * - getMaterialDefaults
 */
export const AssistLineBlock = resolveLegacyMaterialComponent("AssistLine");
export const CarouselBlock = resolveLegacyMaterialComponent("Carousel");
export const CubeSelectionBlock = resolveLegacyMaterialComponent("CubeSelection");
export const DialogBlock = resolveLegacyMaterialComponent("Dialog");
export const FloatLayerBlock = resolveLegacyMaterialComponent("FloatLayer");
export const ImageNavBlock = resolveLegacyMaterialComponent("ImageNav");
export const NoticeBlock = resolveLegacyMaterialComponent("Notice");
export const OnlineServiceBlock = resolveLegacyMaterialComponent("OnlineService");
export const ProductBlock = resolveLegacyMaterialComponent("Product");
export const RichTextBlock = resolveLegacyMaterialComponent("RichText");
export const SliderBlock = resolveLegacyMaterialComponent("Slider");
