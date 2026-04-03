import Image from "next/image";
import styles from "./AddStory.module.scss";

interface Story {
  id: string | number;
  username: string;
  profilePicture?: string;
}

interface RenderStoriesProps {
  stories: Story[];
}

export default function RenderStories({ stories }: RenderStoriesProps) {
  return (
    <>
      {stories.map((story) => (
        <div
          key={story.id}
          className="flex flex-col items-center cursor-pointer"
          title={story.username}
        >
          <div
            className={`relative w-16 h-16 mb-1 hover:scale-105 transition-transform duration-300 ${styles.storyRing}`}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 p-0.5 hover:animate-pulse">
              <div
                className="w-full h-full rounded-full overflow-hidden"
                style={{
                  backgroundColor: "var(--story-core-bg)",
                  border: "2px solid var(--story-core-bg)",
                }}
              >
                {story.profilePicture ? (
                  <Image
                    src={story.profilePicture}
                    alt={story.username}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ background: "var(--story-placeholder-bg)" }}
                  ></div>
                )}
              </div>
            </div>
          </div>
          <span
            className="text-xs transition-colors duration-300 font-semibold mt-1 truncate max-w-[64px] text-center"
            style={{ color: "var(--story-label)" }}
          >
            {story.username}
          </span>
        </div>
      ))}
    </>
  );
}
