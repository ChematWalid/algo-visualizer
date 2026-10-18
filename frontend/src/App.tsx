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
        <button className="nav-item"><IconBook2 size={18} /><span>{language === "en" ? "Concepts" : "Notions"}</span><span className="soon-tag">{language === "en" ? "SOON" : "BIENTÔT"}</span></button>
        <button className="nav-item"><IconGitBranch size={18} /><span>{language === "en" ? "Compare algorithms" : "Comparer les algorithmes"}</span><span className="soon-tag">{language === "en" ? "SOON" : "BIENTÔT"}</span></button>
        <div className="nav-divider" /><div className="nav-group-label">{language === "en" ? "STRUCTURES" : "STRUCTURES"}</div>
        <button className="nav-subitem"><span className="structure-glyph">◉</span>{language === "en" ? "Binary search trees" : "Arbres binaires de recherche"}</button>
        <button className="nav-subitem"><span className="structure-glyph">⌘</span>{language === "en" ? "AVL trees" : "Arbres AVL"}</button>
        <button className="nav-subitem"><span className="structure-glyph">⇧</span>{language === "en" ? "Heaps" : "Tas"}</button>
        <button className="nav-subitem"><span className="structure-glyph">▦</span>{language === "en" ? "M-way & B-trees" : "Arbres m-aires et B"}</button>
        <div className="sidebar-spacer" />
        <div className="course-card"><span className="course-card-icon"><IconBinaryTree size={20} /></span><span className="course-label">{language === "en" ? "COURSE REFERENCE" : "RÉFÉRENCE DU COURS"}</span><strong>{language === "en" ? "Chapter 2" : "Chapitre 2"}</strong><span>{language === "en" ? "Search trees & balancing" : "Arbres de recherche et équilibrage"}</span><div className="course-progress"><i /></div><small>{language === "en" ? "Interactive reference" : "Référence interactive"}</small></div>
        <button className="collapse-nav" onClick={() => setCollapsed((value) => !value)}><span>{collapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}</span><span>{collapsed ? (language === "en" ? "Expand sidebar" : "Développer le menu") : (language === "en" ? "Collapse sidebar" : "Réduire le menu")}</span></button>
        <div className="sidebar-user"><span className="user-avatar">W</span><span className="user-details"><strong>{language === "en" ? "Guest workspace" : "Espace invité"}</strong><small>{language === "en" ? "Browser saved" : "Enregistré localement"}</small></span><IconMoon size={16} className="user-more" /></div>
      </aside>
      <main className="main-content"><TreeWorkspace language={language} /><footer className="app-footer"><span>ARBO<span>.</span> {language === "en" ? "ALGORITHM LEARNING LAB" : "LABORATOIRE D’ALGORITHMIQUE"}</span><span>{language === "en" ? "Built for curious minds" : "Conçu pour les esprits curieux"} <span className="footer-sparkle">✳</span></span></footer></main>
    </div>
  </MantineProvider>;
}
