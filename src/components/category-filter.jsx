"use client"

export function CategoryFilter({ selected, onSelect }) {
  const categories = [
    { id: "all", label: "All", icon: "✨" },
    { id: "Gaming", label: "Gaming", icon: "🎮" },
    { id: "Music", label: "Music", icon: "🎵" },
    { id: "Technology", label: "Technology", icon: "💻" },
    { id: "Comedy", label: "Comedy", icon: "😂" },
    { id: "Entertainment", label: "Entertainment", icon: "🎬" },
  ]

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 mb-6 -mx-4 px-4 md:mx-0 md:px-0">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onSelect(category.id)}
          className={`whitespace-nowrap px-4 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
            selected === category.id
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-card text-foreground hover:bg-card/80 border border-border"
          }`}
        >
          <span>{category.icon}</span>
          {category.label}
        </button>
      ))}
    </div>
  )
}
