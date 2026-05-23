import { View } from "@react-pdf/renderer";
import type { StoryTag } from "../../../schemas";
import { TagPillPdf } from "./tag-pill-pdf";

export function TagList({ tags }: { tags: readonly StoryTag[] }) {
  return (
    <View
      style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 2 }}
    >
      {tags.map((t) => (
        <TagPillPdf
          key={t.id}
          name={t.name}
          variant={t.polarity}
          scratched={t.scratched}
        />
      ))}
    </View>
  );
}
