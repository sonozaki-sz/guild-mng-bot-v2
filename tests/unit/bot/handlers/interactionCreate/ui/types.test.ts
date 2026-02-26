// tests/unit/bot/handlers/interactionCreate/ui/types.test.ts
import type {
  ButtonHandler,
  ModalHandler,
  StringSelectHandler,
  UserSelectHandler,
} from "@/bot/handlers/interactionCreate/ui/types";

describe("bot/handlers/interactionCreate/ui/types", () => {
  it("allows importing handler interfaces", () => {
    const buttonHandler: ButtonHandler | null = null;
    const modalHandler: ModalHandler | null = null;
    const userSelectHandler: UserSelectHandler | null = null;
    const stringSelectHandler: StringSelectHandler | null = null;

    expect(buttonHandler).toBeNull();
    expect(modalHandler).toBeNull();
    expect(userSelectHandler).toBeNull();
    expect(stringSelectHandler).toBeNull();
  });
});
