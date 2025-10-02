-- ============================================
-- Complete Test & Review Seeding Script
-- For user1@example.com (da447d2d-bfed-4e3a-a493-4f55762b91f5)
-- ============================================
-- This script adds:
-- - 3 Biology tests with questions containing hints
-- - 3 completed test attempts with mixed correct/incorrect answers
-- - Detailed test_attempt_answers for review generation
-- - 1 review test generated from wrong answers
-- ============================================

-- Clean up existing test data for this user (keep concepts, sessions, achievements)
DELETE FROM test_attempt_answers WHERE attempt_id IN (
    SELECT id FROM test_attempts WHERE user_id = 'da447d2d-bfed-4e3a-a493-4f55762b91f5'
);
DELETE FROM test_attempts WHERE user_id = 'da447d2d-bfed-4e3a-a493-4f55762b91f5';
DELETE FROM tests WHERE created_by = 'da447d2d-bfed-4e3a-a493-4f55762b91f5';

-- ============================================
-- TEST 1: Cell Biology Fundamentals
-- ============================================
INSERT INTO tests (
    id, code, title, source_filename, source_text, model, params_json, 
    questions_json, expires_at, time_limit_seconds, created_at, created_by,
    is_review, concepts_json, adaptive_mode
) VALUES (
    'test-bio-001',
    'CELL101',
    'Cell Biology Fundamentals',
    'cell_biology.txt',
    'Cell biology fundamentals covering cell structure, membrane transport, and basic cellular processes.',
    'gpt-4',
    '{"temperature":0.7,"difficulty":"medium"}',
    '[
        {
            "id": "q-cell-001",
            "type": "mcq",
            "question": "What is the primary function of the cell membrane?",
            "options": ["Control what enters and exits the cell", "Produce ATP", "Store genetic information", "Synthesize proteins"],
            "answer": "Control what enters and exits the cell",
            "difficulty": "easy",
            "concept": "Cell Membrane Transport",
            "hint": "Think about the membrane as a barrier or gatekeeper for the cell."
        },
        {
            "id": "q-cell-002",
            "type": "mcq",
            "question": "During which phase of mitosis do chromosomes align at the cell equator?",
            "options": ["Prophase", "Metaphase", "Anaphase", "Telophase"],
            "answer": "Metaphase",
            "difficulty": "medium",
            "concept": "Mitosis",
            "hint": "The prefix ''meta-'' means middle or between. Think about where chromosomes would be in the middle."
        },
        {
            "id": "q-cell-003",
            "type": "mcq",
            "question": "What is the main product of photosynthesis?",
            "options": ["Oxygen and glucose", "Carbon dioxide and water", "ATP only", "Nitrogen"],
            "answer": "Oxygen and glucose",
            "difficulty": "easy",
            "concept": "Photosynthesis",
            "hint": "Plants produce sugar for energy and release a gas that animals breathe."
        },
        {
            "id": "q-cell-004",
            "type": "mcq",
            "question": "Which process requires oxygen to produce ATP?",
            "options": ["Cellular respiration", "Fermentation", "Glycolysis only", "Photosynthesis"],
            "answer": "Cellular respiration",
            "difficulty": "medium",
            "concept": "Cellular Respiration",
            "hint": "Think about aerobic (with oxygen) processes in mitochondria."
        },
        {
            "id": "q-cell-005",
            "type": "mcq",
            "question": "What structure contains the genetic material in eukaryotic cells?",
            "options": ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
            "answer": "Nucleus",
            "difficulty": "easy",
            "concept": "Cell Membrane Transport",
            "hint": "This organelle is often called the control center of the cell."
        },
        {
            "id": "q-cell-006",
            "type": "mcq",
            "question": "Active transport across a membrane requires what?",
            "options": ["Energy (ATP)", "No energy", "Only water", "Sunlight"],
            "answer": "Energy (ATP)",
            "difficulty": "medium",
            "concept": "Cell Membrane Transport",
            "hint": "''Active'' suggests movement that requires effort or energy."
        },
        {
            "id": "q-cell-007",
            "type": "mcq",
            "question": "What is the difference between mitosis and meiosis?",
            "options": ["Mitosis produces 2 identical cells; meiosis produces 4 different cells", "Mitosis produces 4 cells; meiosis produces 2 cells", "They are the same process", "Mitosis only occurs in plants"],
            "answer": "Mitosis produces 2 identical cells; meiosis produces 4 different cells",
            "difficulty": "hard",
            "concept": "Mitosis",
            "hint": "Meiosis is for reproduction (sperm/egg), mitosis is for growth and repair."
        },
        {
            "id": "q-cell-008",
            "type": "mcq",
            "question": "Where does photosynthesis occur in plant cells?",
            "options": ["Chloroplasts", "Mitochondria", "Nucleus", "Ribosomes"],
            "answer": "Chloroplasts",
            "difficulty": "easy",
            "concept": "Photosynthesis",
            "hint": "This organelle contains chlorophyll, the green pigment."
        },
        {
            "id": "q-cell-009",
            "type": "mcq",
            "question": "What type of transport moves water across a membrane?",
            "options": ["Osmosis", "Active transport", "Endocytosis", "Exocytosis"],
            "answer": "Osmosis",
            "difficulty": "medium",
            "concept": "Cell Membrane Transport",
            "hint": "This is a special type of diffusion specifically for water molecules."
        },
        {
            "id": "q-cell-010",
            "type": "mcq",
            "question": "Which stage of cellular respiration produces the most ATP?",
            "options": ["Electron transport chain", "Glycolysis", "Krebs cycle", "Fermentation"],
            "answer": "Electron transport chain",
            "difficulty": "hard",
            "concept": "Cellular Respiration",
            "hint": "This final stage in mitochondria produces about 32-34 ATP molecules."
        }
    ]',
    datetime('now', '+30 days'),
    1800,
    datetime('now', '-10 days'),
    'da447d2d-bfed-4e3a-a493-4f55762b91f5',
    0,
    '["Cell Membrane Transport","Mitosis","Photosynthesis","Cellular Respiration"]',
    0
);

-- ============================================
-- TEST 2: Genetics and DNA
-- ============================================
INSERT INTO tests (
    id, code, title, source_filename, source_text, model, params_json, 
    questions_json, expires_at, time_limit_seconds, created_at, created_by,
    is_review, concepts_json, adaptive_mode
) VALUES (
    'test-bio-002',
    'DNA202',
    'Genetics and DNA Fundamentals',
    'genetics.txt',
    'Genetics fundamentals covering DNA structure, replication, protein synthesis, and heredity.',
    'gpt-4',
    '{"temperature":0.7,"difficulty":"medium"}',
    '[
        {
            "id": "q-dna-001",
            "type": "mcq",
            "question": "What is the complementary base pair to Adenine in DNA?",
            "options": ["Thymine", "Cytosine", "Guanine", "Uracil"],
            "answer": "Thymine",
            "difficulty": "easy",
            "concept": "DNA Replication",
            "hint": "Remember: A-T and G-C are the base pairs in DNA."
        },
        {
            "id": "q-dna-002",
            "type": "mcq",
            "question": "Where does DNA replication occur in eukaryotic cells?",
            "options": ["Nucleus", "Cytoplasm", "Mitochondria only", "Ribosomes"],
            "answer": "Nucleus",
            "difficulty": "medium",
            "concept": "DNA Replication",
            "hint": "DNA is stored and copied in the cell''s control center."
        },
        {
            "id": "q-dna-003",
            "type": "mcq",
            "question": "What is the first step of protein synthesis?",
            "options": ["Transcription", "Translation", "Replication", "Mutation"],
            "answer": "Transcription",
            "difficulty": "medium",
            "concept": "Protein Synthesis",
            "hint": "First, DNA is transcribed (copied) to mRNA."
        },
        {
            "id": "q-dna-004",
            "type": "mcq",
            "question": "Which enzyme unwinds the DNA double helix during replication?",
            "options": ["Helicase", "DNA polymerase", "RNA polymerase", "Ligase"],
            "answer": "Helicase",
            "difficulty": "hard",
            "concept": "DNA Replication",
            "hint": "Think ''helix'' unwinding - the name is similar to the structure."
        },
        {
            "id": "q-dna-005",
            "type": "mcq",
            "question": "What molecule carries amino acids to the ribosome during translation?",
            "options": ["tRNA", "mRNA", "rRNA", "DNA"],
            "answer": "tRNA",
            "difficulty": "medium",
            "concept": "Protein Synthesis",
            "hint": "Transfer RNA (tRNA) transfers amino acids to build proteins."
        },
        {
            "id": "q-dna-006",
            "type": "mcq",
            "question": "What is a gene?",
            "options": ["A segment of DNA that codes for a protein", "An entire chromosome", "A type of protein", "A cell organelle"],
            "answer": "A segment of DNA that codes for a protein",
            "difficulty": "easy",
            "concept": "Genetics and Heredity",
            "hint": "Genes are the functional units of heredity, storing instructions for proteins."
        },
        {
            "id": "q-dna-007",
            "type": "mcq",
            "question": "According to Mendel''s law, what is a dominant trait?",
            "options": ["A trait that appears when one dominant allele is present", "A trait that only appears with two recessive alleles", "A trait that never appears", "A trait only in males"],
            "answer": "A trait that appears when one dominant allele is present",
            "difficulty": "medium",
            "concept": "Genetics and Heredity",
            "hint": "Dominant traits mask recessive traits and only need one copy to show."
        },
        {
            "id": "q-dna-008",
            "type": "mcq",
            "question": "What is the role of mRNA in protein synthesis?",
            "options": ["Carries genetic information from DNA to ribosomes", "Unwinds DNA", "Builds the ribosome", "Stores genetic information"],
            "answer": "Carries genetic information from DNA to ribosomes",
            "difficulty": "medium",
            "concept": "Protein Synthesis",
            "hint": "Messenger RNA (mRNA) is the messenger between DNA and protein-making machinery."
        },
        {
            "id": "q-dna-009",
            "type": "mcq",
            "question": "What is a mutation?",
            "options": ["A change in DNA sequence", "Normal cell division", "A type of protein", "Energy production"],
            "answer": "A change in DNA sequence",
            "difficulty": "easy",
            "concept": "Genetics and Heredity",
            "hint": "Mutations are alterations or mistakes in the genetic code."
        },
        {
            "id": "q-dna-010",
            "type": "mcq",
            "question": "During which phase of the cell cycle does DNA replication occur?",
            "options": ["S phase (synthesis)", "G1 phase", "G2 phase", "M phase (mitosis)"],
            "answer": "S phase (synthesis)",
            "difficulty": "medium",
            "concept": "DNA Replication",
            "hint": "The S stands for synthesis - DNA is synthesized (made) during this phase."
        },
        {
            "id": "q-dna-011",
            "type": "mcq",
            "question": "What determines the sequence of amino acids in a protein?",
            "options": ["The sequence of nucleotides in DNA", "The cell membrane", "ATP molecules", "The mitochondria"],
            "answer": "The sequence of nucleotides in DNA",
            "difficulty": "medium",
            "concept": "Protein Synthesis",
            "hint": "The genetic code in DNA determines protein structure through its base sequence."
        },
        {
            "id": "q-dna-012",
            "type": "mcq",
            "question": "What is the difference between genotype and phenotype?",
            "options": ["Genotype is genetic makeup; phenotype is observable traits", "Genotype is observable; phenotype is genetic", "They are the same thing", "Genotype only applies to plants"],
            "answer": "Genotype is genetic makeup; phenotype is observable traits",
            "difficulty": "hard",
            "concept": "Genetics and Heredity",
            "hint": "Genotype = genes (genetic code), Phenotype = physical appearance."
        }
    ]',
    datetime('now', '+30 days'),
    2400,
    datetime('now', '-8 days'),
    'da447d2d-bfed-4e3a-a493-4f55762b91f5',
    0,
    '["DNA Replication","Protein Synthesis","Genetics and Heredity"]',
    0
);

-- ============================================
-- TEST 3: Evolution and Enzymes
-- ============================================
INSERT INTO tests (
    id, code, title, source_filename, source_text, model, params_json, 
    questions_json, expires_at, time_limit_seconds, created_at, created_by,
    is_review, concepts_json, adaptive_mode
) VALUES (
    'test-bio-003',
    'EVO303',
    'Evolution and Enzyme Function',
    'evolution_enzymes.txt',
    'Covering evolution, natural selection, enzyme function, and biological catalysis.',
    'gpt-4',
    '{"temperature":0.7,"difficulty":"medium"}',
    '[
        {
            "id": "q-evo-001",
            "type": "mcq",
            "question": "What is natural selection?",
            "options": ["Process where organisms better adapted to their environment survive and reproduce", "Random genetic changes", "Artificial breeding by humans", "Extinction of all species"],
            "answer": "Process where organisms better adapted to their environment survive and reproduce",
            "difficulty": "medium",
            "concept": "Evolution and Natural Selection",
            "hint": "Think about survival of the fittest - nature selects who survives."
        },
        {
            "id": "q-evo-002",
            "type": "mcq",
            "question": "What are enzymes?",
            "options": ["Biological catalysts that speed up reactions", "Types of carbohydrates", "Genetic material", "Cell organelles"],
            "answer": "Biological catalysts that speed up reactions",
            "difficulty": "easy",
            "concept": "Enzyme Function",
            "hint": "Enzymes lower activation energy and speed up chemical reactions without being consumed."
        },
        {
            "id": "q-evo-003",
            "type": "mcq",
            "question": "What is the active site of an enzyme?",
            "options": ["The region where substrate binds", "The entire enzyme molecule", "A type of inhibitor", "The product of the reaction"],
            "answer": "The region where substrate binds",
            "difficulty": "medium",
            "concept": "Enzyme Function",
            "hint": "This is the specific pocket or region where the enzyme does its work."
        },
        {
            "id": "q-evo-004",
            "type": "mcq",
            "question": "According to Darwin, which organisms are most likely to survive?",
            "options": ["Those best adapted to their environment", "The largest organisms", "The oldest organisms", "Those that don''t reproduce"],
            "answer": "Those best adapted to their environment",
            "difficulty": "easy",
            "concept": "Evolution and Natural Selection",
            "hint": "Adaptation is key - it''s not about size or age, but fitness to the environment."
        },
        {
            "id": "q-evo-005",
            "type": "mcq",
            "question": "What factors can affect enzyme activity?",
            "options": ["Temperature, pH, and substrate concentration", "Only temperature", "Only the moon phase", "Enzymes are not affected by anything"],
            "answer": "Temperature, pH, and substrate concentration",
            "difficulty": "medium",
            "concept": "Enzyme Function",
            "hint": "Enzymes are proteins sensitive to environmental conditions and substrate availability."
        },
        {
            "id": "q-evo-006",
            "type": "mcq",
            "question": "What is evolution?",
            "options": ["Change in heritable traits of populations over time", "Change in an individual during its lifetime", "Extinction only", "Instant creation of new species"],
            "answer": "Change in heritable traits of populations over time",
            "difficulty": "medium",
            "concept": "Evolution and Natural Selection",
            "hint": "Evolution happens to populations over many generations, not to individuals."
        },
        {
            "id": "q-evo-007",
            "type": "mcq",
            "question": "What happens to an enzyme after catalyzing a reaction?",
            "options": ["It is unchanged and can be used again", "It is destroyed", "It becomes the product", "It turns into ATP"],
            "answer": "It is unchanged and can be used again",
            "difficulty": "medium",
            "concept": "Enzyme Function",
            "hint": "Enzymes are catalysts - they facilitate reactions but aren''t consumed in the process."
        },
        {
            "id": "q-evo-008",
            "type": "mcq",
            "question": "What is a fossil?",
            "options": ["Preserved remains or traces of ancient organisms", "A living organism", "A type of rock only", "Modern DNA"],
            "answer": "Preserved remains or traces of ancient organisms",
            "difficulty": "easy",
            "concept": "Evolution and Natural Selection",
            "hint": "Fossils are evidence of ancient life preserved in rock or other materials."
        },
        {
            "id": "q-evo-009",
            "type": "mcq",
            "question": "What is enzyme specificity?",
            "options": ["Each enzyme catalyzes only specific reactions", "Enzymes work on all substrates", "Enzymes only work in plants", "Enzymes are not specific"],
            "answer": "Each enzyme catalyzes only specific reactions",
            "difficulty": "medium",
            "concept": "Enzyme Function",
            "hint": "Like a lock and key - each enzyme fits and works with specific substrates."
        },
        {
            "id": "q-evo-010",
            "type": "mcq",
            "question": "What provides evidence for evolution?",
            "options": ["Fossils, DNA comparisons, and anatomical similarities", "Only fossils", "Only religious texts", "There is no evidence"],
            "answer": "Fossils, DNA comparisons, and anatomical similarities",
            "difficulty": "medium",
            "concept": "Evolution and Natural Selection",
            "hint": "Multiple lines of evidence from different fields support evolutionary theory."
        }
    ]',
    datetime('now', '+30 days'),
    1800,
    datetime('now', '-5 days'),
    'da447d2d-bfed-4e3a-a493-4f55762b91f5',
    0,
    '["Evolution and Natural Selection","Enzyme Function"]',
    0
);

-- ============================================
-- TEST ATTEMPT 1: Cell Biology (7/10 correct)
-- ============================================
INSERT INTO test_attempts (
    id, test_id, user_id, participant_name, display_name,
    started_at, submitted_at, answers_json, score
) VALUES (
    'attempt-001',
    'test-bio-001',
    'da447d2d-bfed-4e3a-a493-4f55762b91f5',
    'user1@example.com',
    'User One',
    datetime('now', '-9 days'),
    datetime('now', '-9 days', '+28 minutes'),
    '{"q-cell-001":"Control what enters and exits the cell","q-cell-002":"Prophase","q-cell-003":"Oxygen and glucose","q-cell-004":"Cellular respiration","q-cell-005":"Nucleus","q-cell-006":"No energy","q-cell-007":"Mitosis produces 2 identical cells; meiosis produces 4 different cells","q-cell-008":"Chloroplasts","q-cell-009":"Active transport","q-cell-010":"Glycolysis"}',
    70.0
);

-- Detailed answers for attempt 1
INSERT INTO test_attempt_answers (id, attempt_id, question_id, question_text, correct_answer, user_answer, is_correct, created_at)
VALUES 
    ('ans-001-01', 'attempt-001', 'q-cell-001', 'What is the primary function of the cell membrane?', 'Control what enters and exits the cell', 'Control what enters and exits the cell', 1, datetime('now', '-9 days')),
    ('ans-001-02', 'attempt-001', 'q-cell-002', 'During which phase of mitosis do chromosomes align at the cell equator?', 'Metaphase', 'Prophase', 0, datetime('now', '-9 days')),
    ('ans-001-03', 'attempt-001', 'q-cell-003', 'What is the main product of photosynthesis?', 'Oxygen and glucose', 'Oxygen and glucose', 1, datetime('now', '-9 days')),
    ('ans-001-04', 'attempt-001', 'q-cell-004', 'Which process requires oxygen to produce ATP?', 'Cellular respiration', 'Cellular respiration', 1, datetime('now', '-9 days')),
    ('ans-001-05', 'attempt-001', 'q-cell-005', 'What structure contains the genetic material in eukaryotic cells?', 'Nucleus', 'Nucleus', 1, datetime('now', '-9 days')),
    ('ans-001-06', 'attempt-001', 'q-cell-006', 'Active transport across a membrane requires what?', 'Energy (ATP)', 'No energy', 0, datetime('now', '-9 days')),
    ('ans-001-07', 'attempt-001', 'q-cell-007', 'What is the difference between mitosis and meiosis?', 'Mitosis produces 2 identical cells; meiosis produces 4 different cells', 'Mitosis produces 2 identical cells; meiosis produces 4 different cells', 1, datetime('now', '-9 days')),
    ('ans-001-08', 'attempt-001', 'q-cell-008', 'Where does photosynthesis occur in plant cells?', 'Chloroplasts', 'Chloroplasts', 1, datetime('now', '-9 days')),
    ('ans-001-09', 'attempt-001', 'q-cell-009', 'What type of transport moves water across a membrane?', 'Osmosis', 'Active transport', 0, datetime('now', '-9 days')),
    ('ans-001-10', 'attempt-001', 'q-cell-010', 'Which stage of cellular respiration produces the most ATP?', 'Electron transport chain', 'Glycolysis', 0, datetime('now', '-9 days'));

-- ============================================
-- TEST ATTEMPT 2: Genetics (8/12 correct)
-- ============================================
INSERT INTO test_attempts (
    id, test_id, user_id, participant_name, display_name,
    started_at, submitted_at, answers_json, score
) VALUES (
    'attempt-002',
    'test-bio-002',
    'da447d2d-bfed-4e3a-a493-4f55762b91f5',
    'user1@example.com',
    'User One',
    datetime('now', '-7 days'),
    datetime('now', '-7 days', '+35 minutes'),
    '{"q-dna-001":"Thymine","q-dna-002":"Nucleus","q-dna-003":"Replication","q-dna-004":"Helicase","q-dna-005":"tRNA","q-dna-006":"A segment of DNA that codes for a protein","q-dna-007":"A trait that appears when one dominant allele is present","q-dna-008":"Carries genetic information from DNA to ribosomes","q-dna-009":"A change in DNA sequence","q-dna-010":"G1 phase","q-dna-011":"The sequence of nucleotides in DNA","q-dna-012":"They are the same thing"}',
    66.7
);

-- Detailed answers for attempt 2
INSERT INTO test_attempt_answers (id, attempt_id, question_id, question_text, correct_answer, user_answer, is_correct, created_at)
VALUES 
    ('ans-002-01', 'attempt-002', 'q-dna-001', 'What is the complementary base pair to Adenine in DNA?', 'Thymine', 'Thymine', 1, datetime('now', '-7 days')),
    ('ans-002-02', 'attempt-002', 'q-dna-002', 'Where does DNA replication occur in eukaryotic cells?', 'Nucleus', 'Nucleus', 1, datetime('now', '-7 days')),
    ('ans-002-03', 'attempt-002', 'q-dna-003', 'What is the first step of protein synthesis?', 'Transcription', 'Replication', 0, datetime('now', '-7 days')),
    ('ans-002-04', 'attempt-002', 'q-dna-004', 'Which enzyme unwinds the DNA double helix during replication?', 'Helicase', 'Helicase', 1, datetime('now', '-7 days')),
    ('ans-002-05', 'attempt-002', 'q-dna-005', 'What molecule carries amino acids to the ribosome during translation?', 'tRNA', 'tRNA', 1, datetime('now', '-7 days')),
    ('ans-002-06', 'attempt-002', 'q-dna-006', 'What is a gene?', 'A segment of DNA that codes for a protein', 'A segment of DNA that codes for a protein', 1, datetime('now', '-7 days')),
    ('ans-002-07', 'attempt-002', 'q-dna-007', 'According to Mendel''s law, what is a dominant trait?', 'A trait that appears when one dominant allele is present', 'A trait that appears when one dominant allele is present', 1, datetime('now', '-7 days')),
    ('ans-002-08', 'attempt-002', 'q-dna-008', 'What is the role of mRNA in protein synthesis?', 'Carries genetic information from DNA to ribosomes', 'Carries genetic information from DNA to ribosomes', 1, datetime('now', '-7 days')),
    ('ans-002-09', 'attempt-002', 'q-dna-009', 'What is a mutation?', 'A change in DNA sequence', 'A change in DNA sequence', 1, datetime('now', '-7 days')),
    ('ans-002-10', 'attempt-002', 'q-dna-010', 'During which phase of the cell cycle does DNA replication occur?', 'S phase (synthesis)', 'G1 phase', 0, datetime('now', '-7 days')),
    ('ans-002-11', 'attempt-002', 'q-dna-011', 'What determines the sequence of amino acids in a protein?', 'The sequence of nucleotides in DNA', 'The sequence of nucleotides in DNA', 1, datetime('now', '-7 days')),
    ('ans-002-12', 'attempt-002', 'q-dna-012', 'What is the difference between genotype and phenotype?', 'Genotype is genetic makeup; phenotype is observable traits', 'They are the same thing', 0, datetime('now', '-7 days'));

-- ============================================
-- TEST ATTEMPT 3: Evolution (9/10 correct)
-- ============================================
INSERT INTO test_attempts (
    id, test_id, user_id, participant_name, display_name,
    started_at, submitted_at, answers_json, score
) VALUES (
    'attempt-003',
    'test-bio-003',
    'da447d2d-bfed-4e3a-a493-4f55762b91f5',
    'user1@example.com',
    'User One',
    datetime('now', '-4 days'),
    datetime('now', '-4 days', '+25 minutes'),
    '{"q-evo-001":"Process where organisms better adapted to their environment survive and reproduce","q-evo-002":"Biological catalysts that speed up reactions","q-evo-003":"The region where substrate binds","q-evo-004":"Those best adapted to their environment","q-evo-005":"Temperature, pH, and substrate concentration","q-evo-006":"Change in heritable traits of populations over time","q-evo-007":"It is unchanged and can be used again","q-evo-008":"Preserved remains or traces of ancient organisms","q-evo-009":"Enzymes work on all substrates","q-evo-010":"Fossils, DNA comparisons, and anatomical similarities"}',
    90.0
);

-- Detailed answers for attempt 3
INSERT INTO test_attempt_answers (id, attempt_id, question_id, question_text, correct_answer, user_answer, is_correct, created_at)
VALUES 
    ('ans-003-01', 'attempt-003', 'q-evo-001', 'What is natural selection?', 'Process where organisms better adapted to their environment survive and reproduce', 'Process where organisms better adapted to their environment survive and reproduce', 1, datetime('now', '-4 days')),
    ('ans-003-02', 'attempt-003', 'q-evo-002', 'What are enzymes?', 'Biological catalysts that speed up reactions', 'Biological catalysts that speed up reactions', 1, datetime('now', '-4 days')),
    ('ans-003-03', 'attempt-003', 'q-evo-003', 'What is the active site of an enzyme?', 'The region where substrate binds', 'The region where substrate binds', 1, datetime('now', '-4 days')),
    ('ans-003-04', 'attempt-003', 'q-evo-004', 'According to Darwin, which organisms are most likely to survive?', 'Those best adapted to their environment', 'Those best adapted to their environment', 1, datetime('now', '-4 days')),
    ('ans-003-05', 'attempt-003', 'q-evo-005', 'What factors can affect enzyme activity?', 'Temperature, pH, and substrate concentration', 'Temperature, pH, and substrate concentration', 1, datetime('now', '-4 days')),
    ('ans-003-06', 'attempt-003', 'q-evo-006', 'What is evolution?', 'Change in heritable traits of populations over time', 'Change in heritable traits of populations over time', 1, datetime('now', '-4 days')),
    ('ans-003-07', 'attempt-003', 'q-evo-007', 'What happens to an enzyme after catalyzing a reaction?', 'It is unchanged and can be used again', 'It is unchanged and can be used again', 1, datetime('now', '-4 days')),
    ('ans-003-08', 'attempt-003', 'q-evo-008', 'What is a fossil?', 'Preserved remains or traces of ancient organisms', 'Preserved remains or traces of ancient organisms', 1, datetime('now', '-4 days')),
    ('ans-003-09', 'attempt-003', 'q-evo-009', 'What is enzyme specificity?', 'Each enzyme catalyzes only specific reactions', 'Enzymes work on all substrates', 0, datetime('now', '-4 days')),
    ('ans-003-10', 'attempt-003', 'q-evo-010', 'What provides evidence for evolution?', 'Fossils, DNA comparisons, and anatomical similarities', 'Fossils, DNA comparisons, and anatomical similarities', 1, datetime('now', '-4 days'));

-- ============================================
-- REVIEW TEST: Generated from Wrong Answers
-- ============================================
INSERT INTO tests (
    id, code, title, source_filename, source_text, model, params_json, 
    questions_json, expires_at, time_limit_seconds, created_at, created_by,
    is_review, review_source_test_id, review_origin_attempt_ids, review_strategy,
    concepts_json, adaptive_mode
) VALUES (
    'test-review-001',
    'REV001',
    'Review Practice (wrong_recent)',
    NULL,
    'Review test based on previously incorrect answers from Cell Biology and Genetics tests.',
    'gpt-4',
    '{"temperature":0.7,"strategy":"wrong_recent","variantMode":"similar"}',
    '[
        {
            "id": "q-rev-001",
            "type": "mcq",
            "question": "In which phase of mitosis do sister chromatids separate and move to opposite poles?",
            "options": ["Anaphase", "Metaphase", "Prophase", "Telophase"],
            "answer": "Anaphase",
            "difficulty": "medium",
            "concept": "Mitosis",
            "hint": "This happens after chromosomes align at the metaphase plate."
        },
        {
            "id": "q-rev-002",
            "type": "mcq",
            "question": "Which type of cellular transport requires ATP energy?",
            "options": ["Active transport", "Passive diffusion", "Osmosis", "Facilitated diffusion"],
            "answer": "Active transport",
            "difficulty": "medium",
            "concept": "Cell Membrane Transport",
            "hint": "This transport moves molecules against their concentration gradient."
        },
        {
            "id": "q-rev-003",
            "type": "mcq",
            "question": "What is the passive movement of water molecules called?",
            "options": ["Osmosis", "Active transport", "Endocytosis", "Phagocytosis"],
            "answer": "Osmosis",
            "difficulty": "easy",
            "concept": "Cell Membrane Transport",
            "hint": "This is a special case of diffusion for water only."
        },
        {
            "id": "q-rev-004",
            "type": "mcq",
            "question": "Which process produces the maximum amount of ATP per glucose molecule?",
            "options": ["Aerobic respiration (with electron transport chain)", "Anaerobic respiration", "Glycolysis alone", "Fermentation"],
            "answer": "Aerobic respiration (with electron transport chain)",
            "difficulty": "medium",
            "concept": "Cellular Respiration",
            "hint": "The complete breakdown using oxygen yields about 36-38 ATP total."
        },
        {
            "id": "q-rev-005",
            "type": "mcq",
            "question": "What is the process of copying DNA information to RNA called?",
            "options": ["Transcription", "Translation", "Replication", "Transformation"],
            "answer": "Transcription",
            "difficulty": "medium",
            "concept": "Protein Synthesis",
            "hint": "This is the first step of gene expression: DNA → RNA."
        },
        {
            "id": "q-rev-006",
            "type": "mcq",
            "question": "In which phase of interphase does DNA replication take place?",
            "options": ["S phase", "G1 phase", "G2 phase", "M phase"],
            "answer": "S phase",
            "difficulty": "medium",
            "concept": "DNA Replication",
            "hint": "The S stands for Synthesis phase where DNA is synthesized."
        },
        {
            "id": "q-rev-007",
            "type": "mcq",
            "question": "What is the relationship between genotype and phenotype?",
            "options": ["Genotype is the genetic code; phenotype is the expressed traits", "Genotype is physical appearance; phenotype is DNA", "They mean the same thing", "Phenotype determines genotype"],
            "answer": "Genotype is the genetic code; phenotype is the expressed traits",
            "difficulty": "hard",
            "concept": "Genetics and Heredity",
            "hint": "Think: genotype = genes (DNA), phenotype = physical traits you can see."
        }
    ]',
    datetime('now', '+7 days'),
    1260,
    datetime('now', '-2 days'),
    'da447d2d-bfed-4e3a-a493-4f55762b91f5',
    1,
    'test-bio-001',
    '["attempt-001","attempt-002"]',
    'wrong_recent',
    '["Mitosis","Cell Membrane Transport","Cellular Respiration","Protein Synthesis","DNA Replication","Genetics and Heredity"]',
    0
);

-- ============================================
-- SEEDING COMPLETE!
-- ============================================
-- 
-- Summary of Test Data:
-- ✅ 3 Biology Tests (Cell Biology, Genetics, Evolution)
-- ✅ All questions include hints for learning
-- ✅ 3 Completed Test Attempts (70%, 67%, 90% scores)
-- ✅ 32 Detailed Test Answers (mix of correct/incorrect)
-- ✅ 1 Review Test generated from wrong answers
-- ✅ 9 Wrong answers for review generation practice
--
-- Wrong Answers in Test Attempts:
-- Attempt 1 (Cell Biology): 3 wrong - Mitosis phases, Active transport, Osmosis, ETC
-- Attempt 2 (Genetics): 4 wrong - Transcription vs Replication, S phase, Genotype/Phenotype  
-- Attempt 3 (Evolution): 1 wrong - Enzyme specificity
--
-- User can now:
-- - View completed test results with hints
-- - Generate review tests from wrong answers
-- - View review test history
-- - Take new review tests
-- - See concept-tagged questions
-- ============================================
