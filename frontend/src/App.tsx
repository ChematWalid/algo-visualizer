import { useState } from "react";
import { ActionIcon, MantineProvider, Tooltip } from "@mantine/core";
import { IconBook2, IconChevronLeft, IconChevronRight, IconGitBranch, IconLanguage, IconMoon, IconSettings2, IconTree, IconBinaryTree } from "@tabler/icons-react";
import { TreeWorkspace } from "./features/visualizer/TreeWorkspace";
import "@mantine/core/styles.css";
import "./styles/global.css";

export default function App() {
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [collapsed, setCollapsed] = useState(false);
  return <MantineProvider defaultColorScheme="dark">
    <div className={`app-shell${collapsed ? " nav-collapsed" : ""}`}>
      <header className="app-header"><div className="brand-block"><span className="brand-mark"><IconTree size={22} stroke={1.8} /></span><span className="brand-name">arbor<span>.</span></span><span className="brand-divider" /><span className="brand-description">Algorithms, made visible</span></div><div className="header-right"><span className="local-status"><i /> Saved locally</span><span className="header-separator" /><Tooltip label={language === "en" ? "Switch to French" : "Switch to English"}><button className="language-toggle" onClick={() => setLanguage((value) => value === "en" ? "fr" : "en")}><IconLanguage size={17} /><span>{language === "en" ? "EN" : "FR"}</span></button></Tooltip><ActionIcon variant="subtle" color="gray" aria-label="Settings"><IconSettings2 size={18} /></ActionIcon><span className="avatar-mark">W</span></div></header>
      <aside className="side-nav">
        <div className="nav-group-label">LEARN</div>
        <button className="nav-item active"><IconTree size={18} /><span>{language === "en" ? "Tree visualizer" : "Visualiseur d’arbres"}</span><span className="nav-active-mark" /></button>
        <button className="nav-item"><IconBook2 size={18} /><span>{language === "en" ? "Concepts" : "Concepts"}</span><span className="soon-tag">SOON</span></button>
        <button className="nav-item"><IconGitBranch size={18} /><span>{language === "en" ? "Compare algorithms" : "Comparer"}</span><span className="soon-tag">SOON</span></button>
        <div className="nav-divider" /><div className="nav-group-label">STRUCTURES</div>
        <button className="nav-subitem"><span className="structure-glyph">◉</span>Binary search trees</button>
        <button className="nav-subitem"><span className="structure-glyph">⌘</span>AVL trees</button>
        <button className="nav-subitem"><span className="structure-glyph">⇧</span>Heaps</button>
        <button className="nav-subitem"><span className="structure-glyph">▦</span>M-way & B-trees</button>
        <div className="sidebar-spacer" />
        <div className="course-card"><span className="course-card-icon"><IconBinaryTree size={20} /></span><span className="course-label">COURSE REFERENCE</span><strong>Chapter 2</strong><span>Search trees & balancing</span><div className="course-progress"><i /></div><small>Interactive reference</small></div>
        <button className="collapse-nav" onClick={() => setCollapsed((value) => !value)}><span>{collapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}</span><span>{collapsed ? "Expand sidebar" : "Collapse sidebar"}</span></button>
        <div className="sidebar-user"><span className="user-avatar">W</span><span className="user-details"><strong>Guest workspace</strong><small>Browser saved</small></span><IconMoon size={16} className="user-more" /></div>
      </aside>
      <main className="main-content"><TreeWorkspace language={language} /><footer className="app-footer"><span>ARBO<span>.</span> ALGORITHM LEARNING LAB</span><span>Built for curious minds <span className="footer-sparkle">✳</span></span></footer></main>
    </div>
  </MantineProvider>;
}
