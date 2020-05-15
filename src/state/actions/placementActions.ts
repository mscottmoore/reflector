import { createStandardAction } from "typesafe-actions";
import { Pos, Entity } from "~types";

export const activatePlacement = createStandardAction("ACTIVATE_PLACEMENT")<{
  template: TemplateName;
  takesTurn: boolean;
  cost?: { resource: Resource; amount: number };
  validitySelector?: string;
  pos?: Pos;
}>();
export const movePlacement = createStandardAction("MOVE_PLACEMENT")<{
  direction: { dx: number; dy: number };
  jumpToValid: boolean;
}>();
export const cancelPlacement = createStandardAction("CANCEL_PLACEMENT")();
export const rotateEntity = createStandardAction("ROTATE_ENTITY")<Entity>();
export const finishPlacement = createStandardAction("FINISH_PLACEMENT")<{
  placeAnother: boolean;
}>();

export const clearReflectors = createStandardAction("CLEAR_REFLECTORS")();
export const removeReflector = createStandardAction("REMOVE_REFLECTOR")<Pos>();
