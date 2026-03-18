# Learning & Concept Details Additions

## Concept Details Endpoint Extension

`GET /api/v1/learning/concepts/:name/details`

Now includes an `attempts` array summarizing all completed test attempts where the parent test's `concepts_json` contains the concept.

Example response fragment:

```json
{
    "concept": {
        "name": "Enzyme Function",
        "mastery": 90,
        "totalAttempts": 25,
        "accuracy": 92
    },
    "history": [{ "date": "2025-09-29T12:00:00Z", "mastery": 90 }],
    "prerequisites": [],
    "relatedConcepts": [],
    "attempts": [
        {
            "attemptId": "attempt-003",
            "testId": "test-bio-003",
            "testCode": "EVO303",
            "testTitle": "Evolution and Enzyme Function",
            "score": 90.0,
            "submittedAt": "2025-09-28T12:34:00.000Z",
            "answered": 10,
            "correct": 9,
            "accuracy": 90,
            "attemptLink": "/api/v1/tests/attempts/attempt-003/results",
            "testLink": "/api/v1/tests/EVO303"
        }
    ]
}
```

### Field Descriptions

-   **attempts[]**: One element per submitted test attempt referencing this concept.
-   **answered / correct / accuracy**: Derived from `test_attempt_answers` joined to the attempt.
-   **attemptLink**: REST path to fetch detailed per-question results.
-   **testLink**: REST path to fetch the base test definition (questions + hints).

### Query Logic

Implementation searches tests whose `concepts_json` LIKE a JSON array containing the concept string and aggregates answer correctness counts.

### Seeding

Existing `seed-tests-complete.sql` already covers attempts referencing concepts such as `Enzyme Function`. No additional seeding required unless adding new concepts/tests.

### Frontend Usage Ideas

-   Show collapsible list of attempts under concept profile.
-   Link to attempt result view to surface wrong answers + hints.
-   Display sparkline of accuracy trend per concept using attempt accuracy values.

### Next Improvements (Optional)

-   Add pagination for attempts if volume grows.
-   Filter attempts by date range or minimum answered questions.
-   Store denormalized concept_attempt_stats table for faster analytics.
