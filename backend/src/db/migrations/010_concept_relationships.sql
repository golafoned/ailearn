-- Concept prerequisite relationships for smart recommendations
CREATE TABLE concept_relationships (
  id TEXT PRIMARY KEY,
  concept_name TEXT NOT NULL,
  prerequisite_name TEXT NOT NULL,
  relationship_type TEXT DEFAULT 'prerequisite' CHECK(relationship_type IN ('prerequisite', 'related', 'advanced')),
  strength INTEGER DEFAULT 1 CHECK(strength >= 1 AND strength <= 5),
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(concept_name, prerequisite_name)
);

CREATE INDEX idx_concept_relationships_concept ON concept_relationships(concept_name);
CREATE INDEX idx_concept_relationships_prereq ON concept_relationships(prerequisite_name);
