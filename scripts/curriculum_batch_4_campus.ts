import { upsertToConvex, validateCaseStudy } from "./quality_gate.ts";

// ============================================================================
// Batch 4: Campus Systems & Machine Coding (Cases 36 - 42)
// Cases 36-40: Beginner (Explorer / Track 0B Campus Systems) — Free tier, rcCost: 0
// Cases 41-42: Intermediate (Builder / Edge & Spatial Systems) — Premium tier, rcCost: 50
// ============================================================================

// ----------------------------------------------------------------------------
// Case 36: Attendance, Timetable & Grade Tracker
// ----------------------------------------------------------------------------
export const case36_attendanceTracker = {
  id: "cs-attendance-tracker-036",
  slug: "campus-attendance-timetable",
  index: "36",
  title: "How Does a Campus Portal Calculate Weighted GPA and Attendance Shortage Alerts?",
  shortTitle: "Attendance & Grade Tracker",
  category: "Campus Systems & LLD",
  subcategory: "Academic Tracking & GPA Engine",
  difficulty: "Beginner",
  learnerLevel: "Explorer",
  estimatedTime: "45-60 minutes",
  minutes: 50,
  status: "published",
  tier: "free",
  rcCost: 0,
  summary:
    "Universities track thousands of student enrollments across semesters with variable course credit weights and strict mandatory attendance thresholds. Discover how an academic tracking engine computes cumulative grade point averages (CGPA) and raises real-time shortage alerts.",
  learningObjectives: [
    "Design object-oriented entities for Students, Courses, Enrollments, and Attendance Records.",
    "Implement weighted arithmetic calculations for Semester GPA (SGPA) and Cumulative GPA (CGPA).",
    "Model stateful threshold alerts when student attendance drops below mandatory limits (e.g. 75%).",
    "Structure clean separation between persistent academic transcripts and dynamic lecture logs.",
  ],
  prerequisites: [
    "Object-Oriented Programming (Classes, Methods, State)",
    "Floating-point calculations and weighted averages",
    "Dictionary and list data structures",
    "Conditional logic and exception handling",
  ],
  engineeringConcepts: [
    "Entity-Relationship Modeling",
    "Weighted Aggregations",
    "Threshold Shortage Alerts",
    "Academic Credit Math",
    "Defensive State Encapsulation",
  ],
  technologies: ["Python", "Java", "Object-Oriented Design", "Machine Coding"],
  tech: ["OOP", "Data Modeling", "Calculators"],
  tags: ["campus", "lld", "beginner", "academic", "tracker"],
  glossary: [
    {
      term: "Entity-Relationship Modeling",
      plainDefinition:
        "Structuring software classes so that real-world entities (students, courses, grades) map cleanly to code objects.",
    },
    {
      term: "Weighted Aggregations",
      plainDefinition:
        "Calculating an average where each item contributes proportionally to its assigned credit weight.",
    },
    {
      term: "Threshold Shortage Alerts",
      plainDefinition:
        "Triggering a warning flag whenever an attendance ratio falls below a regulatory minimum percentage.",
    },
    {
      term: "Academic Credit Math",
      plainDefinition:
        "The formula multiplying course grade points by course credits, divided by total attempted credits.",
    },
    {
      term: "Defensive State Encapsulation",
      plainDefinition:
        "Preventing outside code from directly altering sensitive records without passing validation checks.",
    },
  ],
  primers: [
    {
      concept: "Credit-Weighted GPA Formula",
      minutes: 4,
      definition:
        "GPA is not a simple arithmetic mean. A 4-credit Core Operating Systems class influences your GPA four times more than a 1-credit Seminar.",
      whyNeeded:
        "Computing simple averages penalizes students unfairly and violates university accreditation rules.",
      analogy:
        "Heavy cargo boxes require more fuel to ship than light envelopes; heavier credit courses carry more weight on your academic transcript.",
      tinyExample:
        "total_points = sum(grade * credit for grade, credit in courses)\ntotal_credits = sum(credit for _, credit in courses)\ngpa = round(total_points / total_credits, 2)",
    },
    {
      concept: "Attendance Shortage Invariant",
      minutes: 4,
      definition:
        "Attendance percentage is (attended_lectures / total_held_lectures) * 100. If total is zero, default to 100% to avoid division by zero.",
      whyNeeded:
        "Students must know immediately if they risk being debarred from final semester exams before registration closes.",
      analogy:
        "A car fuel gauge warning light turns amber when remaining fuel drops under 15% capacity.",
      tinyExample:
        "pct = (attended / total * 100) if total > 0 else 100.0\nis_shortage = pct < 75.0",
    },
  ],
  discover: {
    situation:
      "A university registrar manually tabulated 12,000 student exam hall tickets each semester. Three days before finals, hundreds of students discovered they were disqualified due to attendance shortages that were never flagged during the semester. Concurrently, grade calculation discrepancies in multi-credit lab courses produced invalid honors classifications.",
    humanFlow: [
      "Student attends lectures throughout the semester across 6 distinct subjects.",
      "Professors log attendance daily and submit final letter grades at semester conclusion.",
      "The system computes weighted grade points and validates attendance percentages against the 75% bar.",
      "Debarred students receive formal notices before hall-ticket generation.",
    ],
    question:
      "How do you design a clean, modular academic tracking system that calculates weighted GPA and flags attendance shortages without calculation errors or division-by-zero crashes?",
    whyItExists: [
      "Academic integrity requires mathematically exact GPA calculation across variable credit hours.",
      "Students require proactive warnings when their attendance trajectory risks semester debarment.",
      "Universities require auditable grade records that cannot be silently mutated.",
    ],
  },
  understand: {
    overview:
      "The Academic Tracker uses an Enrollment aggregate that associates a Student with a Course, storing grade points and lecture attendance counters. A GPA Engine iterates through enrollments, computing the credit-weighted sum and total credits, while an Attendance Monitor computes percentage ratios and flags shortage violations.",
    components: [
      {
        name: "Student Aggregate",
        whatIsIt:
          "The domain object representing the student learner with their unique registration number and enrolled courses.",
        whyItExists:
          "Encapsulates student identity and provides the root boundary for academic queries.",
        whatItDoes:
          "Maintains course registrations and exposes methods to view current academic status.",
      },
      {
        name: "Course Entity",
        whatIsIt:
          "Represents an academic syllabus offering with course code, credit count, and title.",
        whyItExists: "Provides the credit weight multiplier necessary for GPA calculations.",
        whatItDoes: "Defines the weight (e.g. 3 or 4 credits) applied to grade evaluations.",
      },
      {
        name: "Attendance Monitor",
        whatIsIt: "The calculation service evaluating attended vs total held lectures.",
        whyItExists: "Automates the policy enforcement of the 75% attendance rule.",
        whatItDoes:
          "Calculates attendance percentages and returns warning flags if under threshold.",
      },
      {
        name: "GPA Engine",
        whatIsIt: "The calculation component that computes credit-weighted grade points.",
        whyItExists: "Prevents erroneous unweighted averaging of academic scores.",
        whatItDoes:
          "Multiplies grade points by course credits and divides by total registered credits.",
      },
    ],
    analogy: {
      title: "The Grocery Receipt with Tax Weights",
      everyday: [
        "Different grocery items have different tax rates: luxury goods have higher tax rates than staple vegetables.",
        "Your total tax paid is not the average tax rate; it is weighted by the dollar amount spent on each specific item.",
        "If your total expenditure exceeds your debit card balance, an immediate red alert sounds at checkout.",
      ],
      technical: [
        "Grocery items with tax rates correspond to Courses with credit points.",
        "Dollar spend corresponds to Course Credits.",
        "Total tax calculation is the Weighted GPA computation.",
        "Debit card overdraft alert corresponds to the Attendance Shortage threshold alert.",
      ],
    },
    flow: [
      "Lectures are conducted and attendance is logged incrementing attended and total counters.",
      "Student queries academic portal for status.",
      "Attendance Monitor computes attended / total * 100 for each course.",
      "If any course attendance is < 75%, a shortage alert is appended to the report.",
      "At semester end, grades (0.0 to 10.0 scale) are assigned to each course.",
      "GPA Engine sums (grade_point * credits) and divides by total credits to yield CGPA.",
    ],
  },
  concepts: [
    {
      id: "concept-weighted-avg",
      name: "Weighted Aggregation",
      difficulty: "Beginner",
      simpleDefinition:
        "An aggregation where individual terms are multiplied by a weight factor before summing and normalizing.",
      whyItExists:
        "Not all inputs have equal significance; higher-stake modules must exert greater influence on the composite score.",
      realWorldAnalogy:
        "A final exam worth 60% of your course grade counts much more than a homework assignment worth 5%.",
      technicalExplanation:
        "Formula: sum(value_i * weight_i) / sum(weight_i). Requires validation that sum(weight_i) > 0 to avoid zero division.",
      caseApplication:
        "Multiplying grade point (e.g. 9.0) by credits (4) gives 36.0 quality points. Dividing total quality points by total credits gives GPA.",
      commonMistakes: [
        "Averaging the grade points directly without multiplying by credits.",
        "Failing to handle students who have registered for 0 credits.",
      ],
      practice: [
        "Calculate the GPA of a student with Grade 9 in a 4-credit course and Grade 6 in a 2-credit course.",
        "What should the engine return if a student has enrolled in courses but none have published grades yet?",
      ],
    },
    {
      id: "concept-threshold-alert",
      name: "Threshold Alert Invariant",
      difficulty: "Beginner",
      simpleDefinition:
        "A boolean guard that flips to active when a monitored metric drops below a critical baseline.",
      whyItExists:
        "Allows proactive operational interventions before an irreversible failure boundary is crossed.",
      realWorldAnalogy:
        "A smoke detector sounds when particulate density exceeds safety standards.",
      technicalExplanation:
        "Ratio R = Attended / Total. If Total == 0, R is safe (1.0). If R < 0.75, status is SHORTAGE.",
      caseApplication:
        "Flags students who have missed more than 25% of lectures so faculty advisors can intervene.",
      commonMistakes: [
        "Crashing with ZeroDivisionError when total lectures held is 0 at the start of term.",
        "Using integer division in languages like Python 2 or Java where 3 / 4 evaluates to 0 instead of 0.75.",
      ],
      practice: [
        "A student attended 14 out of 20 classes. Does this trigger a 75% shortage alert?",
        "How many consecutive classes must a student with 14/20 attend to restore attendance to >= 75%?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Campus Attendance & Grade Tracker showing entity relationships and aggregation engines.",
    levels: [
      {
        title: "Level 1: System Interaction Flow",
        description: "Student and Faculty interactions with the Academic Tracking Engine.",
        mermaid: `graph TD
    Faculty["Faculty / Professor"] -->|"Log Attendance & Grades"| Portal["Campus Academic Portal"]
    Student["Student"] -->|"View Transcripts & Alerts"| Portal
    Portal -->|"Aggregate Records"| GPAEngine["GPA & Attendance Calculator"]
    GPAEngine -->|"Persist Transcripts"| AcademicDB["Academic Ledger Store"]
`,
      },
      {
        title: "Level 2: Entity Relationship Model",
        description:
          "Core entities, attributes, and relationships in the academic tracking schema.",
        mermaid: `graph TD
    Student["Student (id, name)"] -->|"has many"| Enrollment["Enrollment"]
    Course["Course (code, credits)"] -->|"referenced by"| Enrollment
    Enrollment --> Attendance["Attendance (attended, total)"]
    Enrollment --> Grade["Grade (grade_point)"]
`,
      },
      {
        title: "Level 3: Calculation & Shortage Evaluation",
        description: "Evaluation logic for credit-weighted GPA and attendance shortage alarms.",
        mermaid: `graph TD
    Start["Calculate Student Summary"] --> CheckEnrollments{"Has Enrollments?"}
    CheckEnrollments -->|"No"| ZeroDefault["Return GPA: 0.0, Alerts: None"]
    CheckEnrollments -->|"Yes"| Loop["Iterate Courses"]
    Loop --> CalcAtt{"Attended / Total < 0.75?"}
    CalcAtt -->|"Yes"| AddAlert["Add Shortage Warning"]
    CalcAtt -->|"No"| AddQuality["Add (Grade * Credits) to Total Points"]
    AddAlert --> AddQuality
    AddQuality --> Next{"More Courses?"}
    Next -->|"Yes"| Loop
    Next -->|"No"| Finalize["GPA = Total Points / Total Credits"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Credit-Weighted GPA vs Unweighted Average",
      what: "Multiply course grade points by course credits before dividing by total credits.",
      why: "Academic fairness requires rigorous courses to carry proportional influence on transcripts.",
      problemSolved:
        "Prevents light elective courses from artificially inflating or deflating degrees.",
      withoutIt:
        "A 1-credit physical education pass would weigh the same as a 4-credit compiler engineering course.",
      alternatives: [
        "Unweighted GPA (simple arithmetic mean).",
        "Pass/Fail binary grading across all curriculum.",
      ],
      tradeoff:
        "Requires tracking credit metadata across all department offerings and validating total credit sums.",
    },
    {
      title: "Zero Total Lectures Edge Case Handling",
      what: "Default attendance ratio to 100% when total lectures held is 0.",
      why: "At the start of the academic term before the first class, students have not missed any lectures.",
      problemSolved:
        "Eliminates ZeroDivisionError crashes during orientation week when timetables are initialized.",
      withoutIt:
        "Portal crashes or incorrectly marks all students as having 0% attendance and debarred.",
      alternatives: [
        "Throw an exception if total is 0.",
        "Return None / null attendance status until class 1 is logged.",
      ],
      tradeoff:
        "Must ensure faculty start logging lectures promptly so the initial 100% placeholder updates.",
    },
  ],
  implementation: {
    behaviour:
      "An AcademicCalculator class that computes the student credit-weighted GPA and detects attendance shortage below the specified threshold.",
    algorithm: [
      "1. Initialize total_quality_points = 0.0 and total_credits = 0.",
      "2. Initialize shortages list to collect course codes where attendance percentage is below threshold.",
      "3. For each course enrollment with (course_code, credits, grade_point, attended_classes, total_classes):",
      "   a. Compute attendance percentage: if total_classes == 0 return 100.0 else (attended / total) * 100.",
      "   b. If attendance percentage < threshold_pct, append course_code to shortages list.",
      "   c. Add (grade_point * credits) to total_quality_points and credits to total_credits.",
      "4. Compute GPA = round(total_quality_points / total_credits, 2) if total_credits > 0 else 0.0.",
      "5. Return a dictionary with 'gpa' and 'shortages'.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Basic Unweighted Mean",
        detail: "Sum all grade points and divide by course count. Fails credit weighting rules.",
      },
      {
        level: "Level 1",
        title: "Weighted GPA Calculator",
        detail: "Multiplies grades by credit weights with zero-division safeguard.",
      },
      {
        level: "Level 2",
        title: "Attendance Shortage Guard",
        detail:
          "Adds threshold evaluation and flags courses below mandatory attendance percentage.",
      },
      {
        level: "Level 3",
        title: "Production Academic Transcript Engine",
        detail: "Handles incomplete courses, grade point validation, and transcript audit reports.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "academic_calculator.py",
        code: `class AcademicCalculator:
    @staticmethod
    def evaluate_student(courses: list[dict], threshold_pct: float = 75.0) -> dict:
        total_points = 0.0
        total_credits = 0
        shortages = []

        for c in courses:
            credits = c.get("credits", 0)
            grade = c.get("grade", 0.0)
            attended = c.get("attended", 0)
            total = c.get("total", 0)

            pct = (attended / total * 100.0) if total > 0 else 100.0
            if pct < threshold_pct:
                shortages.append(c["code"])

            total_points += grade * credits
            total_credits += credits

        gpa = round(total_points / total_credits, 2) if total_credits > 0 else 0.0
        return {"gpa": gpa, "shortages": shortages}`,
        explanations: [
          {
            code: "pct = (attended / total * 100.0) if total > 0 else 100.0",
            explanation: "Safeguards against division by zero when no lectures have yet occurred.",
          },
          {
            code: "total_points += grade * credits",
            explanation: "Accumulates credit-weighted quality points for the numerator.",
          },
          {
            code: "gpa = round(total_points / total_credits, 2) if total_credits > 0 else 0.0",
            explanation:
              "Divides quality points by total credits and formats to standard two decimal places.",
          },
        ],
      },
    ],
    simulationNote:
      "This implementation simulates the core evaluation logic of an academic ERP system in pure memory without external database overhead.",
  },
  practice: [
    {
      level: "Understand",
      title: "Identify Credit Impact",
      brief:
        "Explain why getting an A (10.0) in a 4-credit course raises CGPA more than getting an A in a 2-credit course.",
    },
    {
      level: "Modify",
      title: "Add Medical Leave Exemption",
      brief:
        "Modify the attendance calculation to support an approved medical leave counter that reduces the denominator total lectures.",
    },
    {
      level: "Build",
      title: "Semester SGPA vs Cumulative CGPA",
      brief:
        "Implement a multi-semester tracker where previous semester credit points combine with the current semester to produce cumulative CGPA.",
    },
    {
      level: "Think",
      title: "Audit Trail Invariants",
      brief:
        "How would you ensure that a professor cannot modify grades after final registrar approval without triggering an audit violation?",
    },
  ],
  reflection: [
    "Why is credit-weighted aggregation required for academic transcripts instead of a simple mean?",
    "How does defensive default handling (such as 100% attendance when total lectures is zero) protect software from runtime crashes?",
    "What data structures best represent the many-to-many relationship between Students and Courses?",
  ],
  techNotes: [
    {
      name: "Grading Systems",
      kind: "Academic Standard",
      note: "Universities globally use 4.0 (US), 10.0 (India/Europe), or 7.0 scales. The weighted math remains invariant regardless of the scale maximum.",
    },
    {
      name: "IEEE 754 Precision",
      kind: "Numerical Stability",
      note: "Always round GPA calculations to 2 decimal places to prevent floating point inaccuracies like 8.400000000000002.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Calculate Student GPA and Attendance Shortages",
    brief:
      "Implement `calculate_academic_status`: given a list of course dictionaries with keys (code, credits, grade, attended, total) and a minimum attendance threshold percentage, return a dictionary with 'gpa' (rounded to 2 decimal places) and 'shortages' (list of course codes below threshold).",
    functionName: "calculate_academic_status",
    signature: "def calculate_academic_status(courses: list[dict], threshold_pct: float) -> dict:",
    starterCode: `def calculate_academic_status(courses: list[dict], threshold_pct: float) -> dict:
    # courses is a list of dicts: {"code": str, "credits": int, "grade": float, "attended": int, "total": int}
    # Return {"gpa": float, "shortages": list[str]}
    # If total credits == 0, gpa should be 0.0. Round gpa to 2 decimal places.
    # If a course total == 0, attendance pct is 100.0.
    total_points = 0.0
    total_credits = 0
    shortages = []

    for c in courses:
        credits = c.get("credits", 0)
        grade = c.get("grade", 0.0)
        attended = c.get("attended", 0)
        total = c.get("total", 0)

        pct = (attended / total * 100.0) if total > 0 else 100.0
        if pct < threshold_pct:
            shortages.append(c["code"])

        total_points += grade * credits
        total_credits += credits

    gpa = round(total_points / total_credits, 2) if total_credits > 0 else 0.0
    return {"gpa": gpa, "shortages": shortages}
`,
    javaSignature:
      "public static Map<String, Object> calculateAcademicStatus(List<Map<String, Object>> courses, double thresholdPct)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> calculateAcademicStatus(List<Map<String, Object>> courses, double thresholdPct) {
        double totalPoints = 0.0;
        int totalCredits = 0;
        List<String> shortages = new ArrayList<>();

        for (Map<String, Object> c : courses) {
            int credits = ((Number) c.get("credits")).intValue();
            double grade = ((Number) c.get("grade")).doubleValue();
            int attended = ((Number) c.get("attended")).intValue();
            int total = ((Number) c.get("total")).intValue();

            double pct = total > 0 ? ((double) attended / total * 100.0) : 100.0;
            if (pct < thresholdPct) {
                shortages.add((String) c.get("code"));
            }

            totalPoints += grade * credits;
            totalCredits += credits;
        }

        double gpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100.0) / 100.0 : 0.0;
        Map<String, Object> result = new HashMap<>();
        result.put("gpa", gpa);
        result.put("shortages", shortages);
        return result;
    }
}`,
    mermaid: `graph TD
    Start["calculate_academic_status(courses, threshold_pct)"] --> Loop["Iterate each course"]
    Loop --> CheckPct{"total > 0?"}
    CheckPct -->|"Yes"| CalcRatio["pct = attended / total * 100"]
    CheckPct -->|"No"| Default100["pct = 100.0"]
    CalcRatio --> ShortageCheck{"pct < threshold_pct?"}
    Default100 --> ShortageCheck
    ShortageCheck -->|"Yes"| AddShortage["shortages.append(code)"]
    ShortageCheck -->|"No"| Accumulate["total_points += grade * credits"]
    AddShortage --> Accumulate
    Accumulate --> Next{"More courses?"}
    Next -->|"Yes"| Loop
    Next -->|"No"| Result["Return gpa and shortages"]
`,
    hints: [
      "Always check if total lectures > 0 before computing the attendance fraction.",
      "Check if total_credits > 0 before dividing to get GPA.",
      "Use round(gpa, 2) to format floating point numbers cleanly.",
    ],
    tests: [
      {
        name: "Standard semester with no shortages",
        args: [
          [
            { code: "CS101", credits: 4, grade: 9.0, attended: 36, total: 40 },
            { code: "CS102", credits: 3, grade: 8.0, attended: 28, total: 30 },
          ],
          75.0,
        ],
        expected: { gpa: 8.57, shortages: [] },
      },
      {
        name: "Course with attendance shortage flagged",
        args: [
          [
            { code: "MATH201", credits: 4, grade: 10.0, attended: 20, total: 40 },
            { code: "PHYS101", credits: 3, grade: 7.0, attended: 27, total: 30 },
          ],
          75.0,
        ],
        expected: { gpa: 8.71, shortages: ["MATH201"] },
      },
      {
        name: "Empty courses list returns zero GPA",
        args: [[], 75.0],
        expected: { gpa: 0.0, shortages: [] },
      },
    ],
    explanationPrompt:
      "Explain how your implementation calculates credit-weighted GPA and protects against division-by-zero when classes or credits are zero.",
  },
};

// ----------------------------------------------------------------------------
// Case 37: Campus Placement Drive Portal
// ----------------------------------------------------------------------------
export const case37_placementPortal = {
  id: "cs-placement-portal-037",
  slug: "campus-placement-drive-portal",
  index: "37",
  title:
    "How Does a Campus Placement Drive Portal Filter Eligible Candidates and Allocate Interview Slots?",
  shortTitle: "Campus Placement Portal",
  category: "Campus Systems & LLD",
  subcategory: "Recruitment Workflows & Eligibility Engine",
  difficulty: "Beginner",
  learnerLevel: "Explorer",
  estimatedTime: "50-65 minutes",
  minutes: 55,
  status: "published",
  tier: "free",
  rcCost: 0,
  summary:
    "During campus hiring season, top tech employers impose complex candidate eligibility criteria (minimum CGPA, zero active backlogs, specific engineering branches). Discover how a placement portal filters thousands of candidates and schedules conflict-free interview slots.",
  learningObjectives: [
    "Design a candidate eligibility filter applying multi-attribute rules (CGPA, backlogs, department).",
    "Model the recruitment lifecycle state machine (Applied, Shortlisted, Interview Scheduled, Offered, Accepted).",
    "Implement an interview slot reservation algorithm that prevents double-booking across recruiters.",
    "Enforce the 'One Student, One Offer' campus policy through state transitions.",
  ],
  prerequisites: [
    "Object-Oriented Programming (State Pattern, Inheritance)",
    "Collection filtering and predicates",
    "Dictionary lookups and uniqueness constraints",
  ],
  engineeringConcepts: [
    "Filter Specification Pattern",
    "State Machine Lifecycle",
    "Slot Reservation Locks",
    "Policy Invariant Enforcement",
    "Multi-Attribute Query Matching",
  ],
  technologies: ["Python", "Java", "Object-Oriented Design", "Machine Coding"],
  tech: ["OOP", "State Machine", "Schedulers"],
  tags: ["campus", "placement", "lld", "beginner", "portal"],
  glossary: [
    {
      term: "Filter Specification Pattern",
      plainDefinition:
        "Combining distinct validation criteria into reusable predicates to filter candidate records.",
    },
    {
      term: "State Machine Lifecycle",
      plainDefinition:
        "Guiding an application through defined sequential stages so an invalid jump cannot occur.",
    },
    {
      term: "Slot Reservation Locks",
      plainDefinition:
        "Ensuring an interview time window is granted to at most one student and one interviewer simultaneously.",
    },
    {
      term: "Policy Invariant Enforcement",
      plainDefinition:
        "Hardcoded business rules such as automatically withdrawing a student from future drives once an offer is accepted.",
    },
    {
      term: "Multi-Attribute Query Matching",
      plainDefinition:
        "Evaluating several candidate attributes simultaneously against employer hiring cutoffs.",
    },
  ],
  primers: [
    {
      concept: "Multi-Criteria Eligibility Filter",
      minutes: 4,
      definition:
        "A student is eligible for a company drive if and only if all employer conditions are met: student.cgpa >= min_cgpa AND student.backlogs <= max_backlogs AND student.branch in allowed_branches.",
      whyNeeded:
        "Ineligible candidates appearing for tests waste interview slots and lead to revoked offers.",
      analogy: "Amusement park rides with both height requirements and safety health checks.",
      tinyExample:
        "def is_eligible(s, rule):\n    return s['cgpa'] >= rule['min_cgpa'] and s['backlogs'] <= rule['max_backlogs'] and s['branch'] in rule['branches']",
    },
    {
      concept: "Exclusive Interview Slot Booking",
      minutes: 4,
      definition:
        "A slot defined by (recruiter_id, time_slot) can only be booked by a single student at a time.",
      whyNeeded: "Double-booking an interviewer creates chaos during campus drive day.",
      analogy:
        "Reserving a movie theater seat: once occupied, other buyers must select another seat.",
      tinyExample: "if slot not in booked_slots:\n    booked_slots[slot] = student_id",
    },
  ],
  discover: {
    situation:
      "During annual campus drives, 50 companies visited in one week to recruit 2,000 engineering students. The manual spreadsheet system permitted students with active backlogs to attend tests, while multiple recruiters accidentally double-booked the same candidates for concurrent interviews. Worst of all, students who had already accepted premium offers hoarded remaining interview slots.",
    humanFlow: [
      "Company posts job drive with eligibility criteria (min CGPA, allowed departments, max backlogs).",
      "Placement engine screens candidate database and returns list of eligible applicants.",
      "Eligible students select available interview time slots with visiting engineers.",
      "Upon clearing rounds, candidate receives an offer and system enforces campus placement policies.",
    ],
    question:
      "How do you design an automated placement portal that screens candidates against multi-attribute rules and schedules conflict-free interview slots?",
    whyItExists: [
      "Companies require automated screening to manage hundreds of simultaneous applicants.",
      "Fairness policies require equal opportunity without slot hoarding by placed students.",
      "Interview coordination requires absolute prevention of temporal scheduling collisions.",
    ],
  },
  understand: {
    overview:
      "The Placement Portal encapsulates Student Profiles, Company Job Drives, and an Interview Scheduler. An Eligibility Evaluator filters student collections against company rules. An Interview Slot Manager maintains an allocation index that rejects double-booking across candidate and interviewer time matrices.",
    components: [
      {
        name: "Candidate Registry",
        whatIsIt:
          "Repository of student academic records including CGPA, backlogs, branch, and placement status.",
        whyItExists: "Authoritative profile source for evaluating job applications.",
        whatItDoes: "Stores academic metrics and reflects changes when offers are accepted.",
      },
      {
        name: "Job Drive Entity",
        whatIsIt:
          "Represents an employer recruiting drive with role details and eligibility cutoffs.",
        whyItExists: "Encapsulates company-specific screening criteria.",
        whatItDoes: "Exposes criteria parameters to the screening engine.",
      },
      {
        name: "Eligibility Filter",
        whatIsIt:
          "The predicate matching engine that compares candidate attributes with drive cutoffs.",
        whyItExists: "Filters eligible pools in linear time O(N).",
        whatItDoes:
          "Returns true only if CGPA, backlogs, and branch all satisfy company thresholds.",
      },
      {
        name: "Interview Scheduler",
        whatIsIt:
          "The booking coordinator managing interviewer availability and student interview calendars.",
        whyItExists: "Guarantees collision-free appointment allocations.",
        whatItDoes: "Validates slot availability and records reservations.",
      },
    ],
    analogy: {
      title: "Airport Security & Boarding Pass Control",
      everyday: [
        "To enter an international flight gate, a passenger must satisfy multiple criteria: valid passport, visa clearance, and stamped boarding pass.",
        "Each passenger is assigned exactly one physical seat on the plane; two passengers cannot hold the same seat.",
        "Once a passenger boards and departs, they cannot board another flight leaving at the same time.",
      ],
      technical: [
        "Passport/Visa check corresponds to Eligibility Filtering (CGPA, backlogs, department).",
        "Unique seat assignment corresponds to Conflict-Free Interview Slot Reservation.",
        "Boarding one flight corresponds to Accepting an Offer and withdrawing from other drives.",
      ],
    },
    flow: [
      "Company registers job drive specifying min_cgpa, max_backlogs, and allowed branches.",
      "Students apply to the drive.",
      "System screens applicants: discards candidates not meeting cutoffs or already placed.",
      "Eligible applicants view available interview slots.",
      "Student reserves slot: system checks interviewer availability and student calendar conflicts.",
      "Reservation is confirmed and slot is locked.",
    ],
  },
  concepts: [
    {
      id: "concept-specification",
      name: "Specification Pattern",
      difficulty: "Beginner",
      simpleDefinition:
        "A design pattern where business rules and criteria are encapsulated in separate evaluable predicates.",
      whyItExists:
        "Allows combining and recombining rules (e.g. CGPA rule, branch rule) without altering candidate domain models.",
      realWorldAnalogy:
        "Job posting requirements checklist where every box must be checked before HR calls.",
      technicalExplanation:
        "Combines predicates using logical AND: check(student) = rule1(student) and rule2(student) and rule3(student).",
      caseApplication:
        "Verifies candidate satisfies company academic threshold criteria before permitting interview scheduling.",
      commonMistakes: [
        "Hardcoding company criteria inside the student class.",
        "Allowing null or undefined values to bypass backlog checks.",
      ],
      practice: [
        "How would you add a 'Graduation Year' filter to the specification pattern?",
        "Why is it better to pass criteria objects to a filter rather than writing giant if-else statements?",
      ],
    },
    {
      id: "concept-slot-conflict",
      name: "Temporal Collision Detection",
      difficulty: "Beginner",
      simpleDefinition:
        "Detecting and preventing overlaps when two entities attempt to reserve the same time resource.",
      whyItExists:
        "A recruiter cannot conduct two interviews simultaneously, nor can a student attend two interviews at once.",
      realWorldAnalogy:
        "Two doctors cannot examine different patients in the same physical examination room at the same time.",
      technicalExplanation:
        "Maintains booked keys in a set: key = (recruiter_id, time_slot) and key2 = (student_id, time_slot). If either exists, collision occurs.",
      caseApplication:
        "Locks interview time windows so both parties have a guaranteed 1-on-1 session.",
      commonMistakes: [
        "Checking recruiter availability but forgetting to check student availability.",
        "Failing to roll back state if one half of the reservation fails.",
      ],
      practice: [
        "Design a key structure for a 3-way reservation (student, recruiter, physical room).",
        "What happens if an interviewer cancels their afternoon slots?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Campus Placement Drive Portal showcasing filtering pipeline and slot allocation.",
    levels: [
      {
        title: "Level 1: System Workflow",
        description:
          "High-level interaction between Companies, Students, and the Placement Engine.",
        mermaid: `graph TD
    Company["Company Recruiter"] -->|"Post Drive & Criteria"| Portal["Placement Portal"]
    Student["Student Candidate"] -->|"Apply & Book Slot"| Portal
    Portal -->|"Evaluate Filters"| ScreenEngine["Screening Engine"]
    Portal -->|"Reserve Slots"| SlotMgr["Interview Scheduler"]
`,
      },
      {
        title: "Level 2: Screening Pipeline",
        description: "Sequential filtering pipeline evaluating student eligibility.",
        mermaid: `graph TD
    CandidateList["Candidate Applications"] --> CheckPlaced{"Already Placed?"}
    CheckPlaced -->|"Yes"| RejectPlaced["Reject: Offer Policy Violation"]
    CheckPlaced -->|"No"| CheckCGPA{"CGPA >= Min Cutoff?"}
    CheckCGPA -->|"No"| RejectCGPA["Reject: CGPA Shortage"]
    CheckCGPA -->|"Yes"| CheckBacklogs{"Backlogs <= Allowed?"}
    CheckBacklogs -->|"No"| RejectBacklog["Reject: Active Backlogs"]
    CheckBacklogs -->|"Yes"| CheckBranch{"Branch in Allowed List?"}
    CheckBranch -->|"No"| RejectBranch["Reject: Branch Ineligible"]
    CheckBranch -->|"Yes"| Shortlist["Eligible for Interview Slot"]
`,
      },
      {
        title: "Level 3: Collision-Free Slot Reservation",
        description: "State validation ensuring neither recruiter nor student is double-booked.",
        mermaid: `graph TD
    Req["Request Slot (student_id, recruiter_id, time)"] --> RCheck{"Recruiter busy at time?"}
    RCheck -->|"Yes"| RecruiterConflict["Conflict: Recruiter Booked"]
    RCheck -->|"No"| SCheck{"Student busy at time?"}
    SCheck -->|"Yes"| StudentConflict["Conflict: Student Booked"]
    SCheck -->|"No"| Lock["Lock (recruiter, time) and (student, time)"]
    Lock --> Confirmed["Interview Confirmed"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "One Student One Offer Policy Automation",
      what: "Automatically mark a student as un-screenable for future drives once an offer is formally accepted.",
      why: "Promotes campus equity so all eligible students have an opportunity to secure employment.",
      problemSolved:
        "Prevents top students from collecting 5+ offers while peers receive zero opportunities.",
      withoutIt:
        "A few candidates dominate all interview schedules, causing companies to leave with unfulfilled quotas.",
      alternatives: [
        "Unrestricted offer collection with post-drive settlement.",
        "Tiered policy (students can hold 1 standard offer and 1 dream company offer).",
      ],
      tradeoff:
        "Students must choose carefully before accepting an offer, as the system immediately locks them out.",
    },
    {
      title: "Set-Based Dual-Key Collision Detection",
      what: "Index bookings under both (recruiter, time) and (student, time) composite keys.",
      why: "Provides O(1) instantaneous collision checks for both parties before committing a reservation.",
      problemSolved:
        "Eliminates race conditions and overlapping interview schedules during high-traffic drive days.",
      withoutIt:
        "Recruiters find two students showing up at the same time, or students miss interviews due to overlapping times.",
      alternatives: [
        "Iterate all existing reservations linearly O(N).",
        "Assign fixed batches without student slot preference.",
      ],
      tradeoff: "Requires maintaining two lookup sets in memory and updating both atomically.",
    },
  ],
  implementation: {
    behaviour:
      "A PlacementManager class that screens candidate lists against company criteria and schedules non-colliding interview slots.",
    algorithm: [
      "1. filter_eligible_candidates: iterate through candidates list.",
      "   a. If candidate['is_placed'] is True, skip.",
      "   b. If candidate['cgpa'] < criteria['min_cgpa'], skip.",
      "   c. If candidate['backlogs'] > criteria['max_backlogs'], skip.",
      "   d. If criteria['branches'] is provided and candidate['branch'] not in criteria['branches'], skip.",
      "   e. Include candidate in eligible_candidates list.",
      "2. schedule_slot: given (student_id, recruiter_id, time_slot):",
      "   a. If (recruiter_id, time_slot) is already booked, return False.",
      "   b. If (student_id, time_slot) is already booked, return False.",
      "   c. Record bookings in recruiter_calendar and student_calendar. Return True.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Basic CGPA Filter",
        detail: "Single comparison for CGPA cutoff. Ignores backlogs and branches.",
      },
      {
        level: "Level 1",
        title: "Multi-Attribute Specification Filter",
        detail: "Screens CGPA, backlogs, branch, and placed status simultaneously.",
      },
      {
        level: "Level 2",
        title: "Conflict-Free Slot Scheduler",
        detail: "Manages recruiter and student calendar matrices with collision detection.",
      },
      {
        level: "Level 3",
        title: "Campus Drive Coordinator",
        detail:
          "Automates multi-round recruitment stages with offer acceptance and auto-withdrawal.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "placement_manager.py",
        code: `class PlacementPortal:
    def __init__(self) -> None:
        self.recruiter_slots: set[tuple[str, str]] = set()
        self.student_slots: set[tuple[str, str]] = set()

    def filter_eligible(self, candidates: list[dict], criteria: dict) -> list[str]:
        eligible = []
        for c in candidates:
            if c.get("is_placed", False):
                continue
            if c.get("cgpa", 0.0) < criteria.get("min_cgpa", 0.0):
                continue
            if c.get("backlogs", 0) > criteria.get("max_backlogs", 0):
                continue
            branches = criteria.get("branches")
            if branches and c.get("branch") not in branches:
                continue
            eligible.append(c["id"])
        return eligible

    def book_slot(self, student_id: str, recruiter_id: str, time_slot: str) -> bool:
        r_key = (recruiter_id, time_slot)
        s_key = (student_id, time_slot)
        if r_key in self.recruiter_slots or s_key in self.student_slots:
            return False
        self.recruiter_slots.add(r_key)
        self.student_slots.add(s_key)
        return True`,
        explanations: [
          {
            code: 'if c.get("is_placed", False): continue',
            explanation:
              "Enforces the campus policy preventing already-placed students from competing.",
          },
          {
            code: "if r_key in self.recruiter_slots or s_key in self.student_slots: return False",
            explanation:
              "Performs O(1) collision detection across both recruiter and student agendas.",
          },
          {
            code: "self.recruiter_slots.add(r_key); self.student_slots.add(s_key)",
            explanation: "Atomically commits both booking keys upon conflict validation.",
          },
        ],
      },
    ],
    simulationNote:
      "Models campus drive screening and interview booking workflows using pure in-memory data structures.",
  },
  practice: [
    {
      level: "Understand",
      title: "Filter Sequence Efficiency",
      brief:
        "Why is it computationally faster to check the boolean 'is_placed' flag before checking string membership in allowed branches?",
    },
    {
      level: "Modify",
      title: "Dream Company Exception",
      brief:
        "Modify the eligibility filter to allow placed students to apply if the new company package is >= 2x their current offer.",
    },
    {
      level: "Build",
      title: "Slot Cancellation & Reallocation",
      brief:
        "Implement a cancellation method that frees both recruiter and student slot keys and notifies waitlisted candidates.",
    },
    {
      level: "Think",
      title: "Concurrency During Slot Rush",
      brief:
        "If 500 students click 'Book Slot' at 9:00 AM for the same 10 interview slots, what concurrency primitive prevents overbooking in a web service?",
    },
  ],
  reflection: [
    "How does the Specification pattern improve code maintainability compared to nested if statements?",
    "Why must collision checks examine both the interviewer and the candidate schedules?",
    "What policies prevent unfair hoarding of high-value opportunities during campus drives?",
  ],
  techNotes: [
    {
      name: "Composite Key Indexing",
      kind: "Data Structures",
      note: "Using a tuple (id, time) inside a hash set achieves O(1) lookup and insertion without complex calendar interval trees.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Filter Campus Drive Candidates and Reserve Slots",
    brief:
      "Implement `screen_and_schedule_drive`: given a candidate list, employer eligibility criteria, and a list of slot booking requests `(student_id, recruiter_id, time_slot)`, return a dictionary with 'eligible_students' (list of student IDs) and 'successful_bookings' (count of collision-free slots reserved). Only eligible candidates may book slots.",
    functionName: "screen_and_schedule_drive",
    signature:
      "def screen_and_schedule_drive(candidates: list[dict], criteria: dict, requests: list[tuple[str, str, str]]) -> dict:",
    starterCode: `def screen_and_schedule_drive(candidates: list[dict], criteria: dict, requests: list[tuple[str, str, str]]) -> dict:
    # candidates: list of {"id": str, "cgpa": float, "backlogs": int, "branch": str, "is_placed": bool}
    # criteria: {"min_cgpa": float, "max_backlogs": int, "branches": list[str]}
    # requests: list of (student_id, recruiter_id, time_slot)
    # Return {"eligible_students": list[str], "successful_bookings": int}
    # A booking succeeds only if student is in eligible_students, recruiter is free, and student is free at that time_slot.
    eligible = []
    eligible_set = set()
    for c in candidates:
        if c.get("is_placed", False):
            continue
        if c.get("cgpa", 0.0) < criteria.get("min_cgpa", 0.0):
            continue
        if c.get("backlogs", 0) > criteria.get("max_backlogs", 0):
            continue
        branches = criteria.get("branches")
        if branches and c.get("branch") not in branches:
            continue
        eligible.append(c["id"])
        eligible_set.add(c["id"])

    recruiter_booked = set()
    student_booked = set()
    successful = 0

    for s_id, r_id, time in requests:
        if s_id not in eligible_set:
            continue
        r_key = (r_id, time)
        s_key = (s_id, time)
        if r_key in recruiter_booked or s_key in student_booked:
            continue
        recruiter_booked.add(r_key)
        student_booked.add(s_key)
        successful += 1

    return {"eligible_students": eligible, "successful_bookings": successful}
`,
    javaSignature:
      "public static Map<String, Object> screenAndScheduleDrive(List<Map<String, Object>> candidates, Map<String, Object> criteria, List<List<String>> requests)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> screenAndScheduleDrive(
        List<Map<String, Object>> candidates,
        Map<String, Object> criteria,
        List<List<String>> requests
    ) {
        List<String> eligible = new ArrayList<>();
        Set<String> eligibleSet = new HashSet<>();
        double minCgpa = ((Number) criteria.getOrDefault("min_cgpa", 0.0)).doubleValue();
        int maxBacklogs = ((Number) criteria.getOrDefault("max_backlogs", 0)).intValue();
        List<String> branches = (List<String>) criteria.get("branches");

        for (Map<String, Object> c : candidates) {
            boolean isPlaced = (boolean) c.getOrDefault("is_placed", false);
            if (isPlaced) continue;
            double cgpa = ((Number) c.getOrDefault("cgpa", 0.0)).doubleValue();
            if (cgpa < minCgpa) continue;
            int backlogs = ((Number) c.getOrDefault("backlogs", 0)).intValue();
            if (backlogs > maxBacklogs) continue;
            String branch = (String) c.get("branch");
            if (branches != null && !branches.contains(branch)) continue;

            String id = (String) c.get("id");
            eligible.add(id);
            eligibleSet.add(id);
        }

        Set<String> recruiterBooked = new HashSet<>();
        Set<String> studentBooked = new HashSet<>();
        int successful = 0;

        for (List<String> req : requests) {
            String sId = req.get(0);
            String rId = req.get(1);
            String time = req.get(2);

            if (!eligibleSet.contains(sId)) continue;
            String rKey = rId + "@" + time;
            String sKey = sId + "@" + time;
            if (recruiterBooked.contains(rKey) || studentBooked.contains(sKey)) continue;

            recruiterBooked.add(rKey);
            studentBooked.add(sKey);
            successful++;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("eligible_students", eligible);
        result.put("successful_bookings", successful);
        return result;
    }
}`,
    mermaid: `graph TD
    Start["screen_and_schedule_drive(...)"] --> Filter["Filter candidates meeting criteria"]
    Filter --> CollectEligible["Populate eligible_students & eligible_set"]
    CollectEligible --> LoopReq["For each (student, recruiter, time)"]
    LoopReq --> CheckEligible{"Student in eligible_set?"}
    CheckEligible -->|"No"| Skip["Skip request"]
    CheckEligible -->|"Yes"| CheckCollision{"Recruiter or Student busy at time?"}
    CheckCollision -->|"Yes"| Skip
    CheckCollision -->|"No"| Book["Record booking & successful += 1"]
    Book --> Next{"More requests?"}
    Skip --> Next
    Next -->|"Yes"| LoopReq
    Next -->|"No"| Return["Return eligible_students and successful_bookings"]
`,
    hints: [
      "Ensure candidate is not already placed before screening other attributes.",
      "Check that student is eligible before booking an interview slot for them.",
      "Track both recruiter and student time reservations so neither is double-booked.",
    ],
    tests: [
      {
        name: "Standard screening with successful non-overlapping bookings",
        args: [
          [
            { id: "S1", cgpa: 8.5, backlogs: 0, branch: "CSE", is_placed: false },
            { id: "S2", cgpa: 7.0, backlogs: 0, branch: "ECE", is_placed: false },
            { id: "S3", cgpa: 9.0, backlogs: 1, branch: "CSE", is_placed: false },
          ],
          { min_cgpa: 7.5, max_backlogs: 0, branches: ["CSE", "IT"] },
          [["S1", "R1", "10:00"]],
        ],
        expected: { eligible_students: ["S1"], successful_bookings: 1 },
      },
      {
        name: "Reject booking for collision and ineligible candidate",
        args: [
          [
            { id: "S1", cgpa: 8.0, backlogs: 0, branch: "CSE", is_placed: false },
            { id: "S2", cgpa: 8.5, backlogs: 0, branch: "CSE", is_placed: false },
            { id: "S3", cgpa: 6.0, backlogs: 0, branch: "CSE", is_placed: false },
          ],
          { min_cgpa: 7.5, max_backlogs: 0, branches: ["CSE"] },
          [
            ["S1", "R1", "10:00"],
            ["S2", "R1", "10:00"], // Recruiter R1 collision at 10:00
            ["S3", "R2", "11:00"], // S3 not eligible
          ],
        ],
        expected: { eligible_students: ["S1", "S2"], successful_bookings: 1 },
      },
      {
        name: "Placed student is filtered out",
        args: [
          [{ id: "S1", cgpa: 9.5, backlogs: 0, branch: "CSE", is_placed: true }],
          { min_cgpa: 7.0, max_backlogs: 0, branches: ["CSE"] },
          [["S1", "R1", "10:00"]],
        ],
        expected: { eligible_students: [], successful_bookings: 0 },
      },
    ],
    explanationPrompt:
      "Explain how your implementation combines candidate eligibility filtering with conflict-free slot booking, and how it prevents double-booking recruiters or students.",
  },
};

// ----------------------------------------------------------------------------
// Case 38: Splitwise Shared Expense Splitter
// ----------------------------------------------------------------------------
export const case38_splitwise = {
  id: "cs-splitwise-splitter-038",
  slug: "splitwise-expense-splitter",
  index: "38",
  title: "How Does an Expense Sharing App Simplify Multi-User Debt Graphs?",
  shortTitle: "Splitwise Expense Splitter",
  category: "Machine Coding & LLD",
  subcategory: "Debt Simplification & Expense Ledger",
  difficulty: "Beginner",
  learnerLevel: "Explorer",
  estimatedTime: "50-65 minutes",
  minutes: 55,
  status: "published",
  tier: "free",
  rcCost: 0,
  summary:
    "When flatmates or travel groups share expenses, a web of pairwise debts quickly becomes confusing and redundant. Discover how an expense-sharing engine computes net balances and uses a greedy debt minimization algorithm to settle debts in the minimum number of transactions.",
  learningObjectives: [
    "Design an object-oriented expense ledger supporting Equal, Exact, and Percentage split strategies.",
    "Calculate net balances per user across a collection of group transactions.",
    "Implement the greedy debt simplification algorithm to settle all balances in minimum transfers.",
    "Maintain the fundamental ledger invariant: the sum of all net balances must always equal zero.",
  ],
  prerequisites: [
    "Object-Oriented Programming (Polymorphism, Strategy Pattern)",
    "Graph basics (nodes, directed edges, net balance)",
    "Greedy algorithms and sorting / two-pointer techniques",
  ],
  engineeringConcepts: [
    "Split Strategy Pattern",
    "Net Balance Aggregation",
    "Debt Simplification (Greedy Heap)",
    "Ledger Zero-Sum Invariant",
    "Directed Debt Graph Modeling",
  ],
  technologies: ["Python", "Java", "Object-Oriented Design", "Machine Coding"],
  tech: ["OOP", "Greedy Algorithm", "Ledger Graph"],
  tags: ["machine coding", "lld", "splitwise", "beginner", "fintech"],
  glossary: [
    {
      term: "Split Strategy Pattern",
      plainDefinition:
        "Encapsulating different ways of dividing a bill (equally, exact amounts, or percentages) in interchangeable classes.",
    },
    {
      term: "Net Balance Aggregation",
      plainDefinition:
        "The total amount a person is owed minus the total amount they owe across all historical expenses.",
    },
    {
      term: "Debt Simplification (Greedy Heap)",
      plainDefinition:
        "An algorithm that matches the person with the largest positive balance with the person with the largest negative balance to minimize total payment transactions.",
    },
    {
      term: "Ledger Zero-Sum Invariant",
      plainDefinition:
        "The mathematical guarantee that the sum of all net balances across all participants is strictly zero.",
    },
    {
      term: "Directed Debt Graph Modeling",
      plainDefinition:
        "Representing users as graph nodes and financial obligations as directed edges with monetary weights.",
    },
  ],
  primers: [
    {
      concept: "Net Balance Transformation",
      minutes: 4,
      definition:
        "Instead of tracking 50 individual 'Alice owes Bob' arrows, sum every user's total paid minus their total share. A person with +$40 is owed $40. A person with -$40 owes $40.",
      whyNeeded:
        "Pairwise settlement creates circular chains (A owes B $10, B owes C $10, C owes A $10). Net balances collapse cycles into zero transfers.",
      analogy:
        "If you give someone $10 and they buy you a $10 sandwich, neither owes anyone anything.",
      tinyExample:
        "net[payer] += amount\nfor user, share in shares.items():\n    net[user] -= share",
    },
    {
      concept: "Greedy Debt Matching",
      minutes: 4,
      definition:
        "Take the person with the largest debt (most negative net balance) and the person with the largest credit (most positive net balance). Settle min(credit, abs(debt)). Repeat until all balances reach 0.",
      whyNeeded: "Reduces an N*(N-1) pairwise mess to at most N-1 simple bank transfers.",
      analogy:
        "Pouring water from the most overfilled cup into the emptiest cup until one cup reaches the target fill level.",
      tinyExample:
        "transfer = min(max_credit, -max_debt)\nnet[creditor] -= transfer\nnet[debtor] += transfer",
    },
  ],
  discover: {
    situation:
      "Four college roommates lived together for a year, sharing rent, groceries, electricity, and weekend dining. By graduation, they had logged 142 cross-cutting IOUs. Settling pairwise would require 24 separate bank transfers, multiple wire fees, and bitter disputes over circular debts (e.g. Charlie paying Dave who pays Bob who pays Charlie).",
    humanFlow: [
      "Roommate pays a shared bill (e.g., Alice pays $120 for monthly broadband).",
      "Bill is split equally among the 4 flatmates ($30 each).",
      "System updates net balances: Alice (+90), Bob (-30), Charlie (-30), Dave (-30).",
      "At month end, debt simplification produces the minimum transactions to settle all accounts.",
    ],
    question:
      "How do you design an object-oriented expense sharing engine that computes net user balances and simplifies complex debt cycles into minimum settlement transfers?",
    whyItExists: [
      "Humans struggle to resolve circular debt relationships manually without disputes.",
      "Banking transfer fees and transaction limits make dozens of micro-payments undesirable.",
      "A financial ledger must guarantee conservation of money: total credits must equal total debits.",
    ],
  },
  understand: {
    overview:
      "The Splitwise system models Users, Expenses, and a Split Strategy. When an expense is recorded, the Strategy validates the split inputs (exact amounts, percentages, or equal parts) and generates individual debit obligations. The Debt Simplifier aggregates all obligations into net balances and greedily matches the biggest debtor with the biggest creditor.",
    components: [
      {
        name: "Expense Entity",
        whatIsIt:
          "Represents a single bill with an author, amount, currency, and distribution breakdown.",
        whyItExists: "Captures the immutable financial event.",
        whatItDoes: "Stores who paid and how the expense is allocated among participants.",
      },
      {
        name: "Split Strategy Interface",
        whatIsIt:
          "A polymorphic strategy with implementations for EqualSplit, ExactSplit, and PercentSplit.",
        whyItExists: "Decouples expense math from core user and group domain models.",
        whatItDoes: "Validates input shares and returns per-user debit allocations.",
      },
      {
        name: "Net Balance Ledger",
        whatIsIt: "A hash map mapping each user to their aggregate signed balance.",
        whyItExists: "Collapses all historical transactions into a single dimension per user.",
        whatItDoes: "Tracks who is net creditor (+) and who is net debtor (-).",
      },
      {
        name: "Debt Simplifier",
        whatIsIt:
          "The greedy graph minimization engine that resolves balances into settlement transactions.",
        whyItExists: "Minimizes the count of real-world money transfers needed to clear all debts.",
        whatItDoes: "Iteratively pairs maximal debtors and creditors.",
      },
    ],
    analogy: {
      title: "Poker Chips at the Casino Cage",
      everyday: [
        "During a poker game, players win and lose chips to each other across hundreds of hands.",
        "Players do not calculate who won which specific chip from whom at the end of the night.",
        "Each player simply walks up to the cashier cage with their final stack of chips.",
        "Players with extra chips cash out; players with fewer chips have already bought in.",
      ],
      technical: [
        "Individual poker hands correspond to pairwise Expenses.",
        "Final chip count minus buy-in corresponds to the Net Balance.",
        "The Cashier cage corresponds to the Debt Simplifier settling balances directly.",
      ],
    },
    flow: [
      "User records an expense: specifies payer, total amount, and participant list.",
      "Split Strategy calculates each participant's share and validates sum(shares) == total.",
      "Ledger increments payer net balance by (total - payer_share) and decrements other participants by their share.",
      "When users request settlement, Debt Simplifier separates users into Creditors (> 0) and Debtors (< 0).",
      "While creditors and debtors exist, match max debtor with max creditor for min(|debt|, credit).",
      "Return the simplified list of transfer transactions (from, to, amount).",
    ],
  },
  concepts: [
    {
      id: "concept-zero-sum",
      name: "Zero-Sum Ledger Invariant",
      difficulty: "Beginner",
      simpleDefinition:
        "The fundamental rule that in a closed group, the sum of all positive balances equals the absolute sum of all negative balances.",
      whyItExists:
        "Money cannot magically appear or vanish; every dollar owed by one person is a dollar owed to another.",
      realWorldAnalogy:
        "In a double-entry bookkeeping journal, total debits must equal total credits down to the penny.",
      technicalExplanation:
        "Invariant: sum(net_balance[u] for u in users) == 0. Any deviation indicates a rounding leak or calculation bug.",
      caseApplication:
        "Validates that expense splitting logic never introduces drift or missing pennies.",
      commonMistakes: [
        "Splitting $100 equally among 3 people as 33.33 each, losing 1 cent and violating zero-sum invariant.",
        "Allowing negative payments or zero-participant expenses.",
      ],
      practice: [
        "How do you distribute the remaining 1 cent when splitting $100 among 3 flatmates?",
        "If the sum of balances in a group is +$5.00, what kind of bug occurred?",
      ],
    },
    {
      id: "concept-greedy-min",
      name: "Greedy Debt Minimization",
      difficulty: "Beginner",
      simpleDefinition:
        "Iteratively matching the largest remaining debtor with the largest remaining creditor until all balances reach zero.",
      whyItExists:
        "Reduces transaction friction by guaranteeing that a group of N people can always settle in at most N - 1 transactions.",
      realWorldAnalogy:
        "If Bob owes $50 and Alice is owed $50, have Bob pay Alice directly even if Bob originally borrowed from Charlie.",
      technicalExplanation:
        "O(N log N) using heaps or sorting: pop max debtor D and max creditor C. amount = min(-D, C). Record transfer. Push non-zero remainder back.",
      caseApplication:
        "Converts a messy web of dozens of debts into 2 or 3 clean, direct payments.",
      commonMistakes: [
        "Trying to find the NP-hard minimum subset-sum solution when the greedy heuristic is fast and optimal in 99% of cases.",
        "Creating transfers with $0.00 value.",
      ],
      practice: [
        "Given net balances {A: +50, B: +20, C: -30, D: -40}, trace the greedy settlement steps.",
        "What is the maximum number of transactions needed to settle balances among 5 people?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Splitwise expense engine showing balance aggregation and greedy settlement.",
    levels: [
      {
        title: "Level 1: System Flow",
        description: "Interaction between Group Members, the Expense Tracker, and Settlement.",
        mermaid: `graph TD
    User["Group Member"] -->|"Add Expense (Equal/Exact)"| Ledger["Splitwise Engine"]
    Ledger -->|"Calculate Net Balance"| NetAggregator["Balance Aggregator"]
    NetAggregator -->|"Request Settlement"| Simplifier["Greedy Debt Simplifier"]
    Simplifier -->|"Return Minimum Transfers"| Settlement["Settlement Transactions"]
`,
      },
      {
        title: "Level 2: Strategy Pattern for Bill Splitting",
        description: "Decoupled split strategies validating share inputs.",
        mermaid: `graph TD
    Expense["Expense Object"] --> SplitStrategy["<<Interface>> SplitStrategy"]
    SplitStrategy --> Equal["EqualSplit (split evenly among N)"]
    SplitStrategy --> Exact["ExactSplit (explicit amounts sum to total)"]
    SplitStrategy --> Percent["PercentSplit (percentages sum to 100%)"]
`,
      },
      {
        title: "Level 3: Greedy Settlement Matching",
        description: "Algorithmic matching of highest debtor and highest creditor.",
        mermaid: `graph TD
    Balances["Net Balances"] --> Split{"Partition into Debts (<0) and Credits (>0)"}
    Split --> SortDebtors["Sort Debtors Ascending (most negative first)"]
    Split --> SortCreditors["Sort Creditors Descending (highest positive first)"]
    SortDebtors --> Match["Transfer = min(|debt|, credit)"]
    SortCreditors --> Match
    Match --> Record["Record Transfer (debtor -> creditor, Transfer)"]
    Record --> Remainder{"Remaining balance > 0?"}
    Remainder -->|"Yes"| Match
    Remainder -->|"No"| Done["All Balances Zeroed"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Greedy Heuristic vs Exact Subset-Sum Minimum Transactions",
      what: "Use greedy maximum-debtor-to-maximum-creditor matching rather than an NP-hard minimum partition algorithm.",
      why: "Greedy runs in O(N log N) time and yields at most N-1 transactions, which is practically indistinguishable from optimal in group expense contexts.",
      problemSolved:
        "Prevents exponential time complexity O(2^N) when computing settlements for large travel groups.",
      withoutIt:
        "The mobile app freezes or times out when attempting to settle a trip with 20+ participants.",
      alternatives: [
        "Exact dynamic programming subset-sum solver (exponential in worst case).",
        "No simplification (force everyone to settle pairwise).",
      ],
      tradeoff:
        "May produce 3 transactions instead of 2 in rare symmetrical subset cases (e.g. +10, +10, -10, -10), but runs instantaneously.",
    },
    {
      title: "Strategy Pattern for Expense Allocations",
      what: "Encapsulate split logic into polymorphic classes rather than giant switch statements.",
      why: "Enables adding new splitting formats (e.g. share-based, consumption-based) without modifying core expense classes.",
      problemSolved:
        "Eliminates monolithic if-else blocks that break existing code whenever a new split mode is introduced.",
      withoutIt:
        "Adding a new split option requires editing and risking regressions across the entire billing engine.",
      alternatives: ["Hardcoded procedural functions with type flags."],
      tradeoff: "Increases the number of small classes in the codebase.",
    },
  ],
  implementation: {
    behaviour:
      "A DebtSimplifier class that calculates net balances from expense logs and simplifies debts into minimal payment instructions.",
    algorithm: [
      "1. Initialize net_balances dictionary mapping every user to 0.0.",
      "2. For each expense (payer, amount, splits):",
      "   a. Add amount to net_balances[payer].",
      "   b. For each (user, share) in splits: subtract share from net_balances[user].",
      "3. Separate users into creditors (balance > 0.01) and debtors (balance < -0.01).",
      "4. While creditors and debtors are non-empty:",
      "   a. Pop or peek debtor with most negative balance and creditor with largest positive balance.",
      "   b. transfer_amount = min(-debtor.balance, creditor.balance).",
      "   c. Record transfer: {'from': debtor.name, 'to': creditor.name, 'amount': round(transfer_amount, 2)}.",
      "   d. Update balances: debtor.balance += transfer_amount, creditor.balance -= transfer_amount.",
      "   e. If debtor.balance == 0, remove debtor. If creditor.balance == 0, remove creditor.",
      "5. Return list of transfer dictionaries.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Pairwise IOU Ledger",
        detail: "Records every individual debt without simplification. Creates circular webs.",
      },
      {
        level: "Level 1",
        title: "Net Balance Calculator",
        detail: "Sums total debits and credits per user to produce a net balance sheet.",
      },
      {
        level: "Level 2",
        title: "Greedy Two-Pointer Simplifier",
        detail: "Pairs maximal debtor and creditor to settle debts in at most N-1 transfers.",
      },
      {
        level: "Level 3",
        title: "Multi-Currency Splitwise Engine",
        detail: "Handles currency conversion, exact cent allocation, and partial payments.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "splitwise_simplifier.py",
        code: `class DebtSimplifier:
    @staticmethod
    def simplify_debts(transactions: list[dict]) -> list[dict]:
        balances: dict[str, float] = {}

        for tx in transactions:
            payer = tx["payer"]
            amount = tx["amount"]
            splits = tx["splits"]  # dict of {user: share}

            balances[payer] = balances.get(payer, 0.0) + amount
            for u, share in splits.items():
                balances[u] = balances.get(u, 0.0) - share

        # Separate creditors and debtors
        creditors = []
        debtors = []
        for u, b in balances.items():
            rounded = round(b, 2)
            if rounded > 0.001:
                creditors.append([u, rounded])
            elif rounded < -0.001:
                debtors.append([u, -rounded])  # store debt as positive

        # Sort to match biggest debtor with biggest creditor
        creditors.sort(key=lambda x: x[1], reverse=True)
        debtors.sort(key=lambda x: x[1], reverse=True)

        settlements = []
        i, j = 0, 0
        while i < len(debtors) and j < len(creditors):
            deb_user, deb_amt = debtors[i]
            cred_user, cred_amt = creditors[j]

            transfer = min(deb_amt, cred_amt)
            settlements.append({
                "from": deb_user,
                "to": cred_user,
                "amount": round(transfer, 2)
            })

            debtors[i][1] -= transfer
            creditors[j][1] -= transfer

            if round(debtors[i][1], 2) <= 0:
                i += 1
            if round(creditors[j][1], 2) <= 0:
                j += 1

        return settlements`,
        explanations: [
          {
            code: "balances[payer] = balances.get(payer, 0.0) + amount",
            explanation: "Credits the payer with the total amount paid on behalf of the group.",
          },
          {
            code: "balances[u] = balances.get(u, 0.0) - share",
            explanation: "Debits each participant by their allocated share of the bill.",
          },
          {
            code: "transfer = min(deb_amt, cred_amt)",
            explanation:
              "Greedily clears the maximum possible balance between the two matched parties.",
          },
        ],
      },
    ],
    simulationNote:
      "This implementation simulates debt simplification in pure algorithmic memory without requiring a relational database.",
  },
  practice: [
    {
      level: "Understand",
      title: "Circular Debt Cancellation",
      brief:
        "Explain why a triangle of debts (A owes B $10, B owes C $10, C owes A $10) resolves to 0 transactions under net balance calculation.",
    },
    {
      level: "Modify",
      title: "Support Equal Split Helper",
      brief:
        "Add a helper that takes an amount and a list of participants, splits it equally, and handles the remainder penny by assigning it to the payer.",
    },
    {
      level: "Build",
      title: "Group Balance Ledger",
      brief:
        "Build a Group class that allows adding expenses incrementally and querying any user's current net standing in O(1).",
    },
    {
      level: "Think",
      title: "Subset-Sum Optimality",
      brief:
        "Under what conditions does the greedy debt simplifier produce one more transaction than the theoretically minimal subset-sum solution?",
    },
  ],
  reflection: [
    "Why does computing net balance first simplify debt resolution compared to resolving individual bills?",
    "How does the zero-sum invariant safeguard financial engines from calculation leaks?",
    "What are the trade-offs between a fast greedy O(N log N) settlement algorithm and an exact NP-hard optimal solver?",
  ],
  techNotes: [
    {
      name: "Floating Point Epsilon",
      kind: "Precision",
      note: "Never compare floating point debt balances with == 0.0. Use an epsilon threshold like abs(balance) < 0.001 to avoid micro-penny phantom transfers.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Simplify Group Expenses into Minimal Transfers",
    brief:
      "Implement `simplify_group_expenses`: given a list of expense objects `{'payer': str, 'amount': float, 'splits': {user: share}}`, calculate each user's net balance and return a list of settlement transfer dictionaries `{'from': str, 'to': str, 'amount': float}` matching maximal debtors with maximal creditors. Amounts must be rounded to 2 decimal places.",
    functionName: "simplify_group_expenses",
    signature: "def simplify_group_expenses(expenses: list[dict]) -> list[dict]:",
    starterCode: `def simplify_group_expenses(expenses: list[dict]) -> list[dict]:
    # expenses: list of {"payer": str, "amount": float, "splits": {user: share}}
    # Return list of {"from": str, "to": str, "amount": float}
    balances = {}

    for exp in expenses:
        payer = exp["payer"]
        amt = exp["amount"]
        splits = exp["splits"]

        balances[payer] = balances.get(payer, 0.0) + amt
        for u, share in splits.items():
            balances[u] = balances.get(u, 0.0) - share

    creditors = []
    debtors = []
    for u, b in balances.items():
        val = round(b, 2)
        if val > 0.001:
            creditors.append([u, val])
        elif val < -0.001:
            debtors.append([u, -val])

    creditors.sort(key=lambda x: x[1], reverse=True)
    debtors.sort(key=lambda x: x[1], reverse=True)

    settlements = []
    i, j = 0, 0
    while i < len(debtors) and j < len(creditors):
        deb_user, deb_amt = debtors[i]
        cred_user, cred_amt = creditors[j]

        transfer = round(min(deb_amt, cred_amt), 2)
        if transfer > 0.001:
            settlements.append({
                "from": deb_user,
                "to": cred_user,
                "amount": transfer
            })

        debtors[i][1] = round(debtors[i][1] - transfer, 2)
        creditors[j][1] = round(creditors[j][1] - transfer, 2)

        if debtors[i][1] <= 0.001:
            i += 1
        if creditors[j][1] <= 0.001:
            j += 1

    return settlements
`,
    javaSignature:
      "public static List<Map<String, Object>> simplifyGroupExpenses(List<Map<String, Object>> expenses)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static List<Map<String, Object>> simplifyGroupExpenses(List<Map<String, Object>> expenses) {
        Map<String, Double> balances = new HashMap<>();

        for (Map<String, Object> exp : expenses) {
            String payer = (String) exp.get("payer");
            double amt = ((Number) exp.get("amount")).doubleValue();
            Map<String, Object> splits = (Map<String, Object>) exp.get("splits");

            balances.put(payer, balances.getOrDefault(payer, 0.0) + amt);
            for (Map.Entry<String, Object> entry : splits.entrySet()) {
                double share = ((Number) entry.getValue()).doubleValue();
                balances.put(entry.getKey(), balances.getOrDefault(entry.getKey(), 0.0) - share);
            }
        }

        List<Map.Entry<String, Double>> creditors = new ArrayList<>();
        List<Map.Entry<String, Double>> debtors = new ArrayList<>();

        for (Map.Entry<String, Double> e : balances.entrySet()) {
            double val = Math.round(e.getValue() * 100.0) / 100.0;
            if (val > 0.001) {
                creditors.add(new AbstractMap.SimpleEntry<>(e.getKey(), val));
            } else if (val < -0.001) {
                debtors.add(new AbstractMap.SimpleEntry<>(e.getKey(), -val));
            }
        }

        creditors.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));
        debtors.sort((a, b) -> Double.compare(b.getValue(), a.getValue()));

        List<Map<String, Object>> settlements = new ArrayList<>();
        int i = 0, j = 0;
        while (i < debtors.size() && j < creditors.size()) {
            String debUser = debtors.get(i).getKey();
            double debAmt = debtors.get(i).getValue();
            String credUser = creditors.get(j).getKey();
            double credAmt = creditors.get(j).getValue();

            double transfer = Math.round(Math.min(debAmt, credAmt) * 100.0) / 100.0;
            if (transfer > 0.001) {
                Map<String, Object> item = new HashMap<>();
                item.put("from", debUser);
                item.put("to", credUser);
                item.put("amount", transfer);
                settlements.add(item);
            }

            double remainingDeb = Math.round((debAmt - transfer) * 100.0) / 100.0;
            double remainingCred = Math.round((credAmt - transfer) * 100.0) / 100.0;

            debtors.get(i).setValue(remainingDeb);
            creditors.get(j).setValue(remainingCred);

            if (remainingDeb <= 0.001) i++;
            if (remainingCred <= 0.001) j++;
        }

        return settlements;
    }
}`,
    mermaid: `graph TD
    Start["simplify_group_expenses(expenses)"] --> Agg["Aggregate net balances per user"]
    Agg --> Partition["Split into Debtors (<0) and Creditors (>0)"]
    Partition --> Sort["Sort Debtors and Creditors descending by magnitude"]
    Sort --> MatchLoop["While debtors and creditors exist"]
    MatchLoop --> CalcTransfer["transfer = min(debt, credit)"]
    CalcTransfer --> Append["Append {'from': deb, 'to': cred, 'amount': transfer}"]
    Append --> Deduct["Subtract transfer from both balances"]
    Deduct --> CheckEmpty{"Either balance == 0?"}
    CheckEmpty -->|"Yes"| Advance["Advance index"]
    CheckEmpty -->|"No"| MatchLoop
    Advance --> MatchLoop
    MatchLoop --> Done["Return settlements"]
`,
    hints: [
      "Track net balance by adding payments to the payer and subtracting shares from participants.",
      "Sort creditors and debtors in descending order of balance magnitude.",
      "Round all monetary values to 2 decimal places to prevent floating point residue.",
    ],
    tests: [
      {
        name: "Simple 3-person single bill equal split",
        args: [
          [
            {
              payer: "Alice",
              amount: 90.0,
              splits: { Alice: 30.0, Bob: 30.0, Charlie: 30.0 },
            },
          ],
        ],
        expected: [
          { from: "Bob", to: "Alice", amount: 30.0 },
          { from: "Charlie", to: "Alice", amount: 30.0 },
        ],
      },
      {
        name: "Circular debt cancels cleanly",
        args: [
          [
            { payer: "Alice", amount: 20.0, splits: { Bob: 20.0 } },
            { payer: "Bob", amount: 20.0, splits: { Charlie: 20.0 } },
            { payer: "Charlie", amount: 20.0, splits: { Alice: 20.0 } },
          ],
        ],
        expected: [],
      },
      {
        name: "Multi-party settlement with different amounts",
        args: [
          [
            {
              payer: "A",
              amount: 100.0,
              splits: { A: 25.0, B: 25.0, C: 25.0, D: 25.0 },
            },
            { payer: "B", amount: 50.0, splits: { A: 25.0, B: 25.0 } },
          ],
        ],
        expected: [
          { from: "C", to: "A", amount: 25.0 },
          { from: "D", to: "A", amount: 25.0 },
        ],
      },
    ],
    explanationPrompt:
      "Explain how your implementation calculates net balances and applies the greedy two-pointer matching technique to minimize the total number of settlement transfers.",
  },
};

// ----------------------------------------------------------------------------
// Case 39: Online Turn-Based Chess Engine
// ----------------------------------------------------------------------------
export const case39_chessEngine = {
  id: "cs-chess-engine-039",
  slug: "online-chess-game-engine",
  index: "39",
  title:
    "How Does an Object-Oriented Chess Game Engine Validate Piece Moves and Turn State Transitions?",
  shortTitle: "Online Chess Engine",
  category: "Machine Coding & LLD",
  subcategory: "Game State Machine & Move Validation",
  difficulty: "Beginner",
  learnerLevel: "Explorer",
  estimatedTime: "55-70 minutes",
  minutes: 60,
  status: "published",
  tier: "free",
  rcCost: 0,
  summary:
    "Turn-based strategy games like Chess require strict polymorphic move validation, board boundary enforcement, collision detection, and alternating turn state transitions. Discover how an object-oriented chess engine structures pieces, coordinates, and rules into clean, testable classes.",
  learningObjectives: [
    "Model board squares, coordinates, and game piece hierarchies using Object-Oriented polymorphism.",
    "Implement piece-specific movement validation rules (Rook rectilinear, Bishop diagonal, Knight L-shape).",
    "Detect path obstruction collisions for sliding pieces (Rook, Bishop, Queen).",
    "Manage a turn-based state machine that enforces White/Black player alternations.",
  ],
  prerequisites: [
    "Object-Oriented Programming (Abstract Base Classes, Inheritance, Polymorphism)",
    "2D Grid Cartesian / Matrix indexing (rows 0-7, cols 0-7)",
    "Algebraic chess notation (a1 to h8)",
  ],
  engineeringConcepts: [
    "Polymorphic Move Validation",
    "Turn-Based State Machine",
    "Sliding Piece Path Raycasting",
    "Board Invariant Encapsulation",
    "Defensive Move Legality",
  ],
  technologies: ["Python", "Java", "Object-Oriented Design", "Machine Coding"],
  tech: ["OOP", "Polymorphism", "State Machine"],
  tags: ["chess", "lld", "machine coding", "beginner", "game engine"],
  glossary: [
    {
      term: "Polymorphic Move Validation",
      plainDefinition:
        "Allowing each piece subclass (Rook, Bishop, Knight) to define its own movement logic via an overridden method.",
    },
    {
      term: "Turn-Based State Machine",
      plainDefinition:
        "An engine that tracks whose turn it is (White or Black) and rejects any move submitted out of sequence.",
    },
    {
      term: "Sliding Piece Path Raycasting",
      plainDefinition:
        "Iterating along a straight or diagonal path to ensure no intervening pieces block the move.",
    },
    {
      term: "Board Invariant Encapsulation",
      plainDefinition:
        "Ensuring moves remain strictly within the 8x8 boundary and cannot capture friendly pieces.",
    },
    {
      term: "Defensive Move Legality",
      plainDefinition:
        "Validating that a move obeys all physical board rules before mutating game state.",
    },
  ],
  primers: [
    {
      concept: "Polymorphic Piece Dispatch",
      minutes: 4,
      definition:
        "Rather than having one massive switch statement checking piece types, each piece inherits from an abstract base class `Piece` with an abstract method `is_valid_move(start, end, board)`.",
      whyNeeded:
        "Adding new piece variants (e.g. fairy chess or promotion queens) requires zero changes to the board or game controller.",
      analogy:
        "A universal remote control with a 'power' button: each appliance implements its own power-on routine.",
      tinyExample:
        "class Piece:\n    def is_valid_move(self, start, end, board): raise NotImplementedError()\nclass Rook(Piece):\n    def is_valid_move(self, start, end, board):\n        return start[0] == end[0] or start[1] == end[1]",
    },
    {
      concept: "Path Obstruction Raycast",
      minutes: 4,
      definition:
        "For sliding pieces (Rook, Bishop, Queen), every intermediate square between start and end must be unoccupied. The Knight jumps over pieces and bypasses this check.",
      whyNeeded: "Pieces cannot teleport through occupied squares in standard chess.",
      analogy:
        "A bowling ball requires an open lane; it cannot roll through a pin to hit the pin behind it.",
      tinyExample:
        "step_r = (end_r - start_r) // max(abs(end_r - start_r), 1)\nstep_c = (end_c - start_c) // max(abs(end_c - start_c), 1)",
    },
  ],
  discover: {
    situation:
      "A game development team wrote an online chess server where all move logic was crammed into a single 2,500-line if-else function. Players exploited bugs allowing Bishops to jump over pawns, Rooks to move diagonally if coordinates were negative, and Black players to make two consecutive moves during network lag.",
    humanFlow: [
      "White player selects a piece at square (r1, c1) and an intended target square (r2, c2).",
      "Engine validates that it is currently White's turn.",
      "Engine validates that (r1, c1) contains a White piece and (r2, c2) is inside board bounds.",
      "Piece's polymorphic rule validates geometry (e.g. rectilinear for Rook).",
      "Path raycaster checks that intermediate squares are clear.",
      "Engine executes move, captures any enemy piece on destination, and flips turn to Black.",
    ],
    question:
      "How do you design a modular, object-oriented chess engine that enforces polymorphic piece movement, obstruction raycasting, and strict turn transitions?",
    whyItExists: [
      "Turn-based competitive games require deterministic rule validation without loophole exploits.",
      "Extensibility requires adding special moves (castling, en passant, promotion) without breaking existing pieces.",
      "Clean separation between board state, piece behavior, and player session lifecycle.",
    ],
  },
  understand: {
    overview:
      "The Chess Engine consists of a Board aggregate, a Piece hierarchy, and a GameState controller. The GameState enforces player turn alternation. When a move request arrives, the Board delegates geometric validation to the specific Piece subclass, verifies path clearance, executes the coordinate translation, and toggles active player color.",
    components: [
      {
        name: "Board Aggregate",
        whatIsIt: "An 8x8 matrix of Squares holding optional Piece references.",
        whyItExists: "Encapsulates spatial layout and provides square lookup utilities.",
        whatItDoes: "Stores piece locations and handles piece relocation on valid moves.",
      },
      {
        name: "Piece Base Class & Subclasses",
        whatIsIt: "Abstract class Piece with subclasses Rook, Bishop, Knight, Queen, King, Pawn.",
        whyItExists: "Polymorphically delegates move geometry to the specific piece type.",
        whatItDoes: "Validates if (start, end) delta matches piece movement geometry.",
      },
      {
        name: "Path Raycaster",
        whatIsIt:
          "A utility function checking whether intermediate squares along a vector are empty.",
        whyItExists: "Prevents sliding pieces from phasing through occupied squares.",
        whatItDoes: "Steps from start to end square-by-square checking for obstacles.",
      },
      {
        name: "Game Controller / State Machine",
        whatIsIt:
          "The top-level coordinator tracking current turn, move history, and captured pieces.",
        whyItExists: "Guarantees game rules such as alternating turns.",
        whatItDoes: "Rejects moves submitted out of turn and toggles White/Black state.",
      },
    ],
    analogy: {
      title: "Traffic Intersection Control System",
      everyday: [
        "A traffic intersection has distinct vehicle types (bicycles, cars, light rails) that move differently.",
        "A light rail can only travel on tracks (like a Rook on ranks/files).",
        "No vehicle can drive if another car is stopped directly in front of it in the same lane (Path Obstruction).",
        "Traffic lights alternate green lights strictly between North-South and East-West (Turn State Machine).",
      ],
      technical: [
        "Rail constraints correspond to Piece Polymorphic Move Rules.",
        "Blocked traffic lanes correspond to Path Raycast Obstruction.",
        "Traffic light cycle corresponds to the Turn State Machine (White vs Black).",
      ],
    },
    flow: [
      "Player submits move: start_pos (r1, c1) to end_pos (r2, c2).",
      "Check 1: Bounds check — ensure 0 <= r, c <= 7 for both start and end.",
      "Check 2: Turn check — verify piece at start matches current_player color.",
      "Check 3: Friendly fire — verify piece at end does not match current_player color.",
      "Check 4: Piece geometry — piece.can_move(start, end) returns True.",
      "Check 5: Path raycast — all squares strictly between start and end are empty (for non-Knights).",
      "Execute move: place piece at end, clear start, toggle current_player from 'W' to 'B' (or vice-versa).",
    ],
  },
  concepts: [
    {
      id: "concept-poly-piece",
      name: "Polymorphic Piece Validation",
      difficulty: "Beginner",
      simpleDefinition: "Every chess piece defines its unique move shape in an overridden method.",
      whyItExists:
        "Keeps piece movement logic modular and isolated, avoiding bloated conditional blocks.",
      realWorldAnalogy:
        "Different chess pieces are like different specialized tools in a mechanic's toolbox.",
      technicalExplanation:
        "Rook: dr == 0 or dc == 0. Bishop: abs(dr) == abs(dc). Knight: (abs(dr), abs(dc)) in {(1,2), (2,1)}.",
      caseApplication: "Validates that a Rook cannot move diagonally or a Bishop horizontally.",
      commonMistakes: [
        "Forgetting that start and end cannot be the exact same square (dr == 0 and dc == 0 is invalid).",
        "Hardcoding piece rules in the Board class rather than on the Piece class.",
      ],
      practice: [
        "Write the delta condition for a Queen combining Rook and Bishop rules.",
        "Write the delta condition for a King moving at most 1 square in any direction.",
      ],
    },
    {
      id: "concept-turn-state",
      name: "Turn-Based State Invariant",
      difficulty: "Beginner",
      simpleDefinition:
        "A binary state machine that alternates between Player A (White) and Player B (Black).",
      whyItExists:
        "Prevents one player from making multiple consecutive moves or moving the opponent's pieces.",
      realWorldAnalogy:
        "A chess clock: pressing the button ends your turn and starts your opponent's timer.",
      technicalExplanation:
        "state.current_turn = 'B' if state.current_turn == 'W' else 'W'. Any move by non-active color is rejected.",
      caseApplication:
        "Enforces the core rule that White moves first and players alternate every legal move.",
      commonMistakes: [
        "Toggling turn before move validation succeeds.",
        "Allowing White to move Black's pieces.",
      ],
      practice: [
        "What happens if an invalid move is attempted? Should the turn toggle?",
        "How would you represent a game state that is in CHECK or CHECKMATE?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Object-Oriented Chess Engine showing Board, Piece polymorphism, and Move validator.",
    levels: [
      {
        title: "Level 1: Game Loop & Turn Cycle",
        description: "High-level player interaction with the Chess Game Controller.",
        mermaid: `graph TD
    White["Player White"] -->|"Submit Move"| Game["Chess Game Controller"]
    Black["Player Black"] -->|"Submit Move"| Game
    Game -->|"Validate & Toggle"| State["Turn State: White <-> Black"]
    Game -->|"Delegate Spatial Check"| Board["Chess Board (8x8)"]
`,
      },
      {
        title: "Level 2: Piece Class Hierarchy",
        description: "Polymorphic inheritance tree for chess pieces.",
        mermaid: `graph TD
    Piece["<<Abstract>> Piece (color)"] --> Rook["Rook (dr=0 or dc=0)"]
    Piece --> Bishop["Bishop (abs(dr)==abs(dc))"]
    Piece --> Knight["Knight (1,2 or 2,1)"]
    Piece --> Queen["Queen (Rook or Bishop)"]
`,
      },
      {
        title: "Level 3: Move Validation Pipeline",
        description: "Sequential checks performed before committing a piece relocation.",
        mermaid: `graph TD
    MoveReq["Move (start, end)"] --> CheckBounds{"Bounds valid 0-7?"}
    CheckBounds -->|"No"| Invalid["Reject Move"]
    CheckBounds -->|"Yes"| CheckTurn{"Piece color == current_turn?"}
    CheckTurn -->|"No"| Invalid
    CheckTurn -->|"Yes"| CheckFriendly{"Dest has friendly piece?"}
    CheckFriendly -->|"Yes"| Invalid
    CheckFriendly -->|"No"| CheckGeometry{"Piece geometry valid?"}
    CheckGeometry -->|"No"| Invalid
    CheckGeometry -->|"Yes"| CheckObstruction{"Path clear (if sliding)?"}
    CheckObstruction -->|"No"| Invalid
    CheckObstruction -->|"Yes"| ApplyMove["Move Piece & Toggle Turn"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Polymorphic Subclasses vs Type Enum in Piece Class",
      what: "Use distinct classes (Rook, Bishop, Knight) inheriting from Piece instead of a single class with an enum switch.",
      why: "Adheres to Open/Closed Principle; each piece's movement rule is completely independent and testable.",
      problemSolved:
        "Prevents monster switch statements that must be updated whenever piece rules or special variants are tested.",
      withoutIt: "Modifying Knight move logic risks accidentally breaking Queen or Pawn movement.",
      alternatives: [
        "Single Piece class with giant switch-case statement.",
        "Rule engine using external lookup tables.",
      ],
      tradeoff: "More class files and object instantiation overhead.",
    },
    {
      title: "Pure Geometric Move Validation without Check Simulation",
      what: "Separate pure spatial move legality (geometry + path clearance) from high-level king safety (in-check simulation).",
      why: "Prevents infinite recursion where move validator checks king safety, which checks opponent moves, which checks king safety.",
      problemSolved:
        "Eliminates circular dependency and stack overflow bugs in chess engine implementations.",
      withoutIt:
        "Engine crashes with recursion depth exceeded when simulating hypothetical opponent responses.",
      alternatives: [
        "Monolithic validator doing both spatial checks and king check simulations in one pass.",
      ],
      tradeoff:
        "Requires a two-phase check: first validate spatial legality, then verify that move leaves own king unthreatened.",
    },
  ],
  implementation: {
    behaviour:
      "A ChessEngine class that manages an 8x8 board, validates moves for Rook, Bishop, Knight, and Queen, and alternates turns.",
    algorithm: [
      "1. Check bounds: ensure start and end (row, col) are both in range [0, 7]. If start == end, return False.",
      "2. Check piece existence: ensure board has a piece at start, and piece['color'] == current_turn.",
      "3. Check target square: if board has a piece at end with piece['color'] == current_turn, return False (friendly capture).",
      "4. Validate piece geometry:",
      "   - Rook: dr == 0 or dc == 0.",
      "   - Bishop: abs(dr) == abs(dc).",
      "   - Queen: (dr == 0 or dc == 0) or (abs(dr) == abs(dc)).",
      "   - Knight: (abs(dr), abs(dc)) in {(1, 2), (2, 1)}.",
      "5. If piece is Rook, Bishop, or Queen, perform path raycast: all squares between start and end must be empty.",
      "6. Execute move: board[end_r][end_c] = board[start_r][start_c]; board[start_r][start_c] = None.",
      "7. Toggle current_turn: 'W' -> 'B' or 'B' -> 'W'. Return True.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Coordinate Swapper",
        detail: "Moves pieces without validating movement rules or bounds. Fails chess laws.",
      },
      {
        level: "Level 1",
        title: "Geometric Piece Validator",
        detail: "Validates Rook, Bishop, and Knight deltas but ignores path obstructions.",
      },
      {
        level: "Level 2",
        title: "Obstruction Raycaster & Turn Engine",
        detail: "Adds clear-path raycasting and White/Black turn state machine alternation.",
      },
      {
        level: "Level 3",
        title: "Full FIDE Chess Simulator",
        detail:
          "Supports Pawn 2-square rush, en passant, castling, promotion, check, and checkmate.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "chess_engine.py",
        code: `class ChessEngine:
    def __init__(self) -> None:
        self.board = [[None for _ in range(8)] for _ in range(8)]
        self.turn = "W"

    def is_path_clear(self, r1: int, c1: int, r2: int, c2: int) -> bool:
        dr = 0 if r1 == r2 else (1 if r2 > r1 else -1)
        dc = 0 if c1 == c2 else (1 if c2 > c1 else -1)
        curr_r, curr_c = r1 + dr, c1 + dc
        while (curr_r, curr_c) != (r2, c2):
            if self.board[curr_r][curr_c] is not None:
                return False
            curr_r += dr
            curr_c += dc
        return True

    def make_move(self, r1: int, c1: int, r2: int, c2: int) -> bool:
        if not (0 <= r1 < 8 and 0 <= c1 < 8 and 0 <= r2 < 8 and 0 <= c2 < 8):
            return False
        if (r1, c1) == (r2, c2):
            return False

        piece = self.board[r1][c1]
        if piece is None or piece["color"] != self.turn:
            return False

        dest = self.board[r2][c2]
        if dest is not None and dest["color"] == self.turn:
            return False

        dr, dc = r2 - r1, c2 - c1
        ptype = piece["type"]

        if ptype == "R":
            if dr != 0 and dc != 0:
                return False
            if not self.is_path_clear(r1, c1, r2, c2):
                return False
        elif ptype == "B":
            if abs(dr) != abs(dc):
                return False
            if not self.is_path_clear(r1, c1, r2, c2):
                return False
        elif ptype == "N":
            if (abs(dr), abs(dc)) not in {(1, 2), (2, 1)}:
                return False
        else:
            return False

        # Execute
        self.board[r2][c2] = piece
        self.board[r1][c1] = None
        self.turn = "B" if self.turn == "W" else "W"
        return True`,
        explanations: [
          {
            code: 'if piece is None or piece["color"] != self.turn: return False',
            explanation: "Enforces that a player can only move their own pieces on their turn.",
          },
          {
            code: 'if dest is not None and dest["color"] == self.turn: return False',
            explanation: "Prevents capturing friendly pieces.",
          },
          {
            code: 'self.turn = "B" if self.turn == "W" else "W"',
            explanation: "Toggles turn upon successful move validation and board mutation.",
          },
        ],
      },
    ],
    simulationNote:
      "Simulates core LLD move validation and turn alternation for Rook, Bishop, and Knight.",
  },
  practice: [
    {
      level: "Understand",
      title: "Knight Leap Exception",
      brief: "Why does a Knight not require a path clearance check while Rook and Bishop do?",
    },
    {
      level: "Modify",
      title: "Add Queen Support",
      brief: "Implement Queen movement validation by combining the Rook and Bishop conditions.",
    },
    {
      level: "Build",
      title: "Move History & Undo",
      brief:
        "Implement an undo_last_move() method using an in-memory stack that restores captured pieces and toggles the turn back.",
    },
    {
      level: "Think",
      title: "Board Representation Invariants",
      brief:
        "Compare an 8x8 2D array representation with a 64-bit Bitboard representation. When does a chess engine switch to bitboards?",
    },
  ],
  reflection: [
    "How does polymorphism prevent huge switch statements in game engine design?",
    "Why must path raycasting stop strictly before the destination square rather than including it?",
    "How does a state machine ensure that games stay strictly synchronized between two remote players?",
  ],
  techNotes: [
    {
      name: "Bitboards",
      kind: "Advanced Representation",
      note: "Top chess engines like Stockfish represent piece sets as 64-bit unsigned integers, computing raycasts and moves using bitwise operations in single CPU cycles.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Validate Chess Moves and Alternate Turns",
    brief:
      "Implement `validate_chess_move`: given an 8x8 board (2D list with elements `None` or `{'type': 'R'|'B'|'N', 'color': 'W'|'B'}`), `current_turn` ('W' or 'B'), and move coordinates `(r1, c1, r2, c2)`, return a dictionary `{'valid': bool, 'next_turn': str}`. If valid, `next_turn` is toggled; if invalid, `next_turn` remains `current_turn`. Implement rules for Rook (R), Bishop (B), and Knight (N).",
    functionName: "validate_chess_move",
    signature:
      "def validate_chess_move(board: list[list], current_turn: str, move: tuple[int, int, int, int]) -> dict:",
    starterCode: `def validate_chess_move(board: list[list], current_turn: str, move: tuple[int, int, int, int]) -> dict:
    # move is (r1, c1, r2, c2)
    # Return {"valid": bool, "next_turn": str}
    r1, c1, r2, c2 = move
    if not (0 <= r1 < 8 and 0 <= c1 < 8 and 0 <= r2 < 8 and 0 <= c2 < 8):
        return {"valid": False, "next_turn": current_turn}
    if (r1, c1) == (r2, c2):
        return {"valid": False, "next_turn": current_turn}

    piece = board[r1][c1]
    if piece is None or piece.get("color") != current_turn:
        return {"valid": False, "next_turn": current_turn}

    dest = board[r2][c2]
    if dest is not None and dest.get("color") == current_turn:
        return {"valid": False, "next_turn": current_turn}

    dr, dc = r2 - r1, c2 - c1
    ptype = piece.get("type")

    def is_path_clear(sr, sc, er, ec):
        step_r = 0 if sr == er else (1 if er > sr else -1)
        step_c = 0 if sc == ec else (1 if ec > sc else -1)
        curr_r, curr_c = sr + step_r, sc + step_c
        while (curr_r, curr_c) != (er, ec):
            if board[curr_r][curr_c] is not None:
                return False
            curr_r += step_r
            curr_c += step_c
        return True

    if ptype == "R":
        if dr != 0 and dc != 0:
            return {"valid": False, "next_turn": current_turn}
        if not is_path_clear(r1, c1, r2, c2):
            return {"valid": False, "next_turn": current_turn}
    elif ptype == "B":
        if abs(dr) != abs(dc):
            return {"valid": False, "next_turn": current_turn}
        if not is_path_clear(r1, c1, r2, c2):
            return {"valid": False, "next_turn": current_turn}
    elif ptype == "N":
        if (abs(dr), abs(dc)) not in {(1, 2), (2, 1)}:
            return {"valid": False, "next_turn": current_turn}
    else:
        return {"valid": False, "next_turn": current_turn}

    next_t = "B" if current_turn == "W" else "W"
    return {"valid": True, "next_turn": next_t}
`,
    javaSignature:
      "public static Map<String, Object> validateChessMove(List<List<Map<String, String>>> board, String currentTurn, List<Integer> move)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> validateChessMove(
        List<List<Map<String, String>>> board,
        String currentTurn,
        List<Integer> move
    ) {
        int r1 = move.get(0);
        int c1 = move.get(1);
        int r2 = move.get(2);
        int c2 = move.get(3);

        Map<String, Object> invalid = new HashMap<>();
        invalid.put("valid", false);
        invalid.put("next_turn", currentTurn);

        if (r1 < 0 || r1 >= 8 || c1 < 0 || c1 >= 8 || r2 < 0 || r2 >= 8 || c2 < 0 || c2 >= 8) {
            return invalid;
        }
        if (r1 == r2 && c1 == c2) {
            return invalid;
        }

        Map<String, String> piece = board.get(r1).get(c1);
        if (piece == null || !currentTurn.equals(piece.get("color"))) {
            return invalid;
        }

        Map<String, String> dest = board.get(r2).get(c2);
        if (dest != null && currentTurn.equals(dest.get("color"))) {
            return invalid;
        }

        int dr = r2 - r1;
        int dc = c2 - c1;
        String ptype = piece.get("type");

        if ("R".equals(ptype)) {
            if (dr != 0 && dc != 0) return invalid;
            if (!isPathClear(board, r1, c1, r2, c2)) return invalid;
        } else if ("B".equals(ptype)) {
            if (Math.abs(dr) != Math.abs(dc)) return invalid;
            if (!isPathClear(board, r1, c1, r2, c2)) return invalid;
        } else if ("N".equals(ptype)) {
            int adr = Math.abs(dr);
            int adc = Math.abs(dc);
            if (!((adr == 1 && adc == 2) || (adr == 2 && adc == 1))) {
                return invalid;
            }
        } else {
            return invalid;
        }

        String nextTurn = "W".equals(currentTurn) ? "B" : "W";
        Map<String, Object> valid = new HashMap<>();
        valid.put("valid", true);
        valid.put("next_turn", nextTurn);
        return valid;
    }

    private static boolean isPathClear(List<List<Map<String, String>>> board, int r1, int c1, int r2, int c2) {
        int stepR = r1 == r2 ? 0 : (r2 > r1 ? 1 : -1);
        int stepC = c1 == c2 ? 0 : (c2 > c1 ? 1 : -1);
        int currR = r1 + stepR;
        int currC = c1 + stepC;
        while (currR != r2 || currC != c2) {
            if (board.get(currR).get(currC) != null) {
                return false;
            }
            currR += stepR;
            currC += stepC;
        }
        return true;
    }
}`,
    mermaid: `graph TD
    Start["validate_chess_move(board, turn, move)"] --> Bounds{"Within 8x8 & r1!=r2 or c1!=c2?"}
    Bounds -->|"No"| RetInvalid["Return valid: False, next_turn: turn"]
    Bounds -->|"Yes"| TurnCheck{"Piece exists & color == turn?"}
    TurnCheck -->|"No"| RetInvalid
    TurnCheck -->|"Yes"| FriendlyCheck{"Dest piece color == turn?"}
    FriendlyCheck -->|"Yes"| RetInvalid
    FriendlyCheck -->|"No"| GeomCheck{"Piece move geometry valid?"}
    GeomCheck -->|"No"| RetInvalid
    GeomCheck -->|"Yes"| Obstruction{"Is sliding path clear?"}
    Obstruction -->|"No"| RetInvalid
    Obstruction -->|"Yes"| RetValid["Return valid: True, next_turn: toggled"]
`,
    hints: [
      "Ensure start coordinates contain a piece of the matching current_turn color.",
      "Knights ignore path obstruction, but Rook and Bishop cannot jump over pieces.",
      "Only toggle the turn when the move is valid.",
    ],
    tests: [
      {
        name: "Valid Rook horizontal move in open board",
        args: [
          [
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, { type: "R", color: "W" }, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
          ],
          "W",
          [2, 2, 2, 6],
        ],
        expected: { valid: true, next_turn: "B" },
      },
      {
        name: "Blocked Bishop path is rejected",
        args: [
          [
            [{ type: "B", color: "W" }, null, null, null, null, null, null, null],
            [null, { type: "R", color: "B" }, null, null, null, null, null, null], // Obstacle at (1,1)
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
          ],
          "W",
          [0, 0, 2, 2],
        ],
        expected: { valid: false, next_turn: "W" },
      },
      {
        name: "Knight jumps over obstacle legally",
        args: [
          [
            [{ type: "N", color: "W" }, null, null, null, null, null, null, null],
            [
              { type: "R", color: "W" },
              { type: "R", color: "W" },
              null,
              null,
              null,
              null,
              null,
              null,
            ], // Blockers around
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
          ],
          "W",
          [0, 0, 1, 2], // L-shaped move
        ],
        expected: { valid: true, next_turn: "B" },
      },
    ],
    explanationPrompt:
      "Explain how your move validator implements polymorphic piece rules, handles sliding piece path obstruction, and maintains turn consistency.",
  },
};

// ----------------------------------------------------------------------------
// Case 40: Support Ticket Routing & Priority Queue
// ----------------------------------------------------------------------------
export const case40_ticketRouting = {
  id: "cs-ticket-routing-040",
  slug: "support-ticket-routing-queue",
  index: "40",
  title: "How Does a Customer Support Ticket Queue Match High-Priority Issues with Skilled Agents?",
  shortTitle: "Support Ticket Router",
  category: "Machine Coding & LLD",
  subcategory: "Priority Queues & Agent Dispatch",
  difficulty: "Beginner",
  learnerLevel: "Explorer",
  estimatedTime: "50-65 minutes",
  minutes: 55,
  status: "published",
  tier: "free",
  rcCost: 0,
  summary:
    "Enterprise support desks receive thousands of tickets across varying severities (P0 outage vs P3 question) and domains (Billing, Security, Hardware). Discover how an automated router prioritizes critical tickets and dispatches them to available agents based on skill tags and capacity limits.",
  learningObjectives: [
    "Design an object-oriented ticket routing system using Priority Queues (Min-Heap / Priority ordering).",
    "Model Agent capacity constraints and skill-matching predicates.",
    "Implement priority aging to prevent ticket starvation for lower-priority queries.",
    "Structure clean thread-safe dispatch state transitions (OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED).",
  ],
  prerequisites: [
    "Object-Oriented Programming (Classes, Methods, State)",
    "Priority Queues / Heaps concepts",
    "Set operations and tag matching",
  ],
  engineeringConcepts: [
    "Priority Queue Dispatch",
    "Skill Tag Matching",
    "Agent Capacity Throttling",
    "Starvation Prevention Aging",
    "Ticket Lifecycle State Machine",
  ],
  technologies: ["Python", "Java", "Object-Oriented Design", "Machine Coding"],
  tech: ["OOP", "Priority Queue", "Dispatcher"],
  tags: ["machine coding", "lld", "queue", "beginner", "support"],
  glossary: [
    {
      term: "Priority Queue Dispatch",
      plainDefinition:
        "Serving incoming items in order of urgent priority rank rather than simple first-in first-out arrival time.",
    },
    {
      term: "Skill Tag Matching",
      plainDefinition:
        "Routing a problem only to agents who possess the required domain certifications (e.g. 'Billing' or 'Postgres').",
    },
    {
      term: "Agent Capacity Throttling",
      plainDefinition:
        "Preventing burnout by capping how many concurrent active tickets any single agent can hold.",
    },
    {
      term: "Starvation Prevention Aging",
      plainDefinition:
        "Gradually bumping the priority score of older waiting tickets so low-priority issues eventually get solved.",
    },
    {
      term: "Ticket Lifecycle State Machine",
      plainDefinition:
        "Tracking ticket progression through defined states: OPEN, ASSIGNED, RESOLVED, CLOSED.",
    },
  ],
  primers: [
    {
      concept: "Priority-Ranked Queuing",
      minutes: 4,
      definition:
        "A P0 (Critical Service Outage) ticket must jump in front of 500 P3 (How-to question) tickets. Sort order prioritizes lower numeric rank (0 < 1 < 2 < 3) followed by arrival timestamp.",
      whyNeeded:
        "Treating enterprise production outages as first-come first-served causes multi-million dollar SLA breach penalties.",
      analogy:
        "Hospital Emergency Room triage: a cardiac arrest patient is treated immediately ahead of a patient with a minor sprained wrist.",
      tinyExample: "tickets.sort(key=lambda t: (t['priority'], t['created_at']))",
    },
    {
      concept: "Skill-Based Routing Predicate",
      minutes: 4,
      definition:
        "An agent can take a ticket if and only if ticket.required_skills is a subset of agent.skills AND agent.active_tickets < agent.max_capacity.",
      whyNeeded:
        "Routing a complex database replication crash to an agent who only knows basic invoice billing wastes customer time.",
      analogy:
        "Assigning a pediatric patient specifically to a pediatrician rather than a general dental assistant.",
      tinyExample: "can_handle = req_skills.issubset(agent_skills) and agent_active < max_cap",
    },
  ],
  discover: {
    situation:
      "A fast-growing SaaS startup used a single shared Slack channel for customer support. As ticket volume reached 5,000 per day, high-severity database corruption tickets were lost beneath hundreds of password reset requests. Meanwhile, senior engineers were overwhelmed with 30 tickets each while new agents sat idle because skills were not tracked.",
    humanFlow: [
      "Customer files an incident with description, urgency level (P0-P3), and category tags.",
      "Router enqueues ticket into a prioritized pool.",
      "Router inspects the pool and matches top ticket with the first available agent holding required skills.",
      "Agent capacity counter increments and ticket status changes to ASSIGNED.",
      "Upon resolution, agent capacity frees up to accept new tickets.",
    ],
    question:
      "How do you design a ticket routing queue that matches high-priority issues with qualified available agents without exceeding agent capacities?",
    whyItExists: [
      "Enterprise Service Level Agreements (SLAs) mandate rapid resolution times for critical incidents.",
      "Agent productivity collapses if workload is distributed unevenly or beyond human capacity.",
      "Specialized technical domains require strict skill matching.",
    ],
  },
  understand: {
    overview:
      "The Support Ticket System encapsulates Tickets, Agents, and an Automated Dispatcher. Tickets have a priority level and required skills. Agents maintain a skill set and a concurrent ticket capacity. The Dispatcher prioritizes tickets by severity and arrival time, scanning available agents to find the best match.",
    components: [
      {
        name: "Ticket Entity",
        whatIsIt:
          "Represents a support request with id, priority (0-3), tags, creation timestamp, and state.",
        whyItExists: "Encapsulates customer problem details and tracks resolution lifecycle.",
        whatItDoes: "Stores priority rank and required competencies.",
      },
      {
        name: "Agent Entity",
        whatIsIt:
          "Represents a support representative with skill tags, max capacity, and current active tickets.",
        whyItExists: "Models worker competence and availability constraints.",
        whatItDoes: "Accepts tickets and signals when capacity is full.",
      },
      {
        name: "Priority Queue",
        whatIsIt: "The prioritized data structure ordering pending tickets.",
        whyItExists: "Guarantees highest-severity tickets are evaluated first.",
        whatItDoes: "Pops tickets in order of (priority, timestamp).",
      },
      {
        name: "Routing Dispatcher",
        whatIsIt: "The coordinator matching top-priority tickets to qualified free agents.",
        whyItExists: "Automates the assignment policy across the support department.",
        whatItDoes: "Evaluates skill subsets and assigns tickets.",
      },
    ],
    analogy: {
      title: "Airport Air Traffic Control",
      everyday: [
        "Planes approaching an airport runway have different priorities: emergency low-fuel planes land first.",
        "Runways have specific qualifications: heavy cargo jets can only land on long international runways.",
        "A runway can only service one landing aircraft at a time (runway capacity).",
      ],
      technical: [
        "Approaching planes correspond to incoming Support Tickets.",
        "Fuel emergency priority corresponds to P0/P1 SLA Priority.",
        "Runway length requirements correspond to Agent Skill Tags.",
        "Runway occupancy corresponds to Agent Concurrent Capacity.",
      ],
    },
    flow: [
      "Ticket is submitted with priority P (0 is most urgent, 3 is least) and required skills.",
      "Dispatcher inserts ticket into priority queue.",
      "Dispatcher checks pending tickets in priority order.",
      "For each ticket, search agent pool for an agent where required_skills is a subset of agent_skills AND active < max_capacity.",
      "If matched, assign ticket to agent, increment agent active count, remove ticket from queue.",
      "If no agent is currently free or qualified, ticket remains in queue for next dispatch cycle.",
    ],
  },
  concepts: [
    {
      id: "concept-priority-queue",
      name: "Priority Queue Ordering",
      difficulty: "Beginner",
      simpleDefinition:
        "A queue where elements are retrieved in order of importance rather than arrival sequence.",
      whyItExists: "Ensures urgent problems are always resolved ahead of non-critical inquiries.",
      realWorldAnalogy: "Express checkout lanes or emergency room triage.",
      technicalExplanation:
        "Items are ordered by tuple (priority_int, arrival_timestamp). P0 arrives before P1.",
      caseApplication:
        "Prevents P0 security breaches from waiting behind routine newsletter unsubscribe tickets.",
      commonMistakes: [
        "Inverting priority order (treating 3 as higher priority than 0).",
        "Ignoring creation timestamp, causing tickets of the same priority to be processed randomly.",
      ],
      practice: [
        "How do you implement a priority comparator that breaks priority ties using timestamp?",
        "Why is a Binary Heap O(log N) more scalable than sorting a list O(N log N) on every new ticket?",
      ],
    },
    {
      id: "concept-capacity-throttle",
      name: "Agent Capacity Throttling",
      difficulty: "Beginner",
      simpleDefinition:
        "Limiting the maximum number of concurrent active tasks assigned to a single worker.",
      whyItExists: "Prevents context switching, human burnout, and stalled customer conversations.",
      realWorldAnalogy:
        "A restaurant server is assigned a maximum of 4 tables simultaneously to maintain service quality.",
      technicalExplanation:
        "Guard condition: if agent.active_count >= agent.max_capacity: skip agent.",
      caseApplication:
        "Spreads work evenly across the support department instead of crushing one star employee.",
      commonMistakes: [
        "Incrementing active count on assignment but forgetting to decrement it upon resolution.",
        "Allowing overflow without manager escalation.",
      ],
      practice: [
        "What happens when all agents reach maximum capacity?",
        "Design an alert that notifies support leads when queue backlog exceeds total department capacity.",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Support Ticket Routing Queue showing priority intake, skill filtering, and agent dispatch.",
    levels: [
      {
        title: "Level 1: System Interaction",
        description: "Customer Ticket Submission, Router Dispatch, and Agent Resolution.",
        mermaid: `graph TD
    Customer["Customer"] -->|"Submit Incident"| Router["Ticket Router"]
    Router -->|"Enqueue"| PQueue["Priority Queue (P0 -> P3)"]
    Router -->|"Inspect Available Capacity"| Agents["Agent Pool"]
    Agents -->|"Resolve & Free Capacity"| Router
`,
      },
      {
        title: "Level 2: Dispatch Pipeline",
        description: "Evaluation logic matching queued tickets with capable agents.",
        mermaid: `graph TD
    QueueHead["Pop Highest Priority Ticket"] --> SearchAgent["Search Agents"]
    SearchAgent --> CheckSkill{"Agent has required skills?"}
    CheckSkill -->|"No"| NextAgent["Check Next Agent"]
    CheckSkill -->|"Yes"| CheckCapacity{"Active < Max Capacity?"}
    CheckCapacity -->|"No"| NextAgent
    CheckCapacity -->|"Yes"| Assign["Assign Ticket to Agent & active += 1"]
    NextAgent --> AnyLeft{"More Agents?"}
    AnyLeft -->|"Yes"| SearchAgent
    AnyLeft -->|"No"| Requeue["Keep Ticket in Queue for next tick"]
`,
      },
      {
        title: "Level 3: Ticket Lifecycle State Machine",
        description: "State transitions for individual support incidents.",
        mermaid: `graph TD
    Open["OPEN (In Priority Queue)"] -->|"Matched with Agent"| Assigned["ASSIGNED"]
    Assigned -->|"Agent Starts Work"| InProgress["IN_PROGRESS"]
    InProgress -->|"Customer Fix Provided"| Resolved["RESOLVED"]
    Resolved -->|"Capacity Decremented"| Closed["CLOSED"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Skill Subset Matching vs Best-Fit Scoring",
      what: "Require that agent skills contain all ticket required skills (subset check) rather than a fuzzy partial score.",
      why: "Ensures technical competence; an agent missing security clearance or database access cannot solve the ticket.",
      problemSolved:
        "Eliminates wasted handoffs where an agent accepts a ticket only to discover 20 minutes later they lack credentials.",
      withoutIt:
        "Tickets bounce between 4 different agents before finding someone with the right access permissions.",
      alternatives: [
        "Fuzzy score based on percentage of matching tags.",
        "Single primary category tag per ticket.",
      ],
      tradeoff:
        "If no agent has all required skills, the ticket stays queued until someone upskills or the ticket is edited.",
    },
    {
      title: "Hard Capacity Cap per Agent",
      what: "Strictly reject assigning tickets to agents who have reached max_capacity.",
      why: "Human cognitive capacity is bounded; overloaded agents provide poor service and miss SLA targets.",
      problemSolved:
        "Prevents tickets from languishing in an individual agent's inbox while other agents could assist.",
      withoutIt: "Eager agents take 50 tickets and leave customers waiting for days.",
      alternatives: [
        "Soft limits with weighted round-robin distribution.",
        "Uncapped pull-based queue.",
      ],
      tradeoff:
        "During high-load traffic surges, the queue depth grows faster if agent capacity is saturated.",
    },
  ],
  implementation: {
    behaviour:
      "A TicketRouter class that enqueues tickets by priority and dispatches them to matching available agents.",
    algorithm: [
      "1. Add ticket: append to queue with (priority, created_at, id, skills).",
      "2. Sort / prioritize queue by priority ASC, created_at ASC.",
      "3. dispatch_tickets: iterate through copy of pending queue.",
      "   a. For each ticket, find an agent in agents list where:",
      "      - ticket['skills'] is subset of agent['skills']",
      "      - agent['active'] < agent['capacity']",
      "   b. If found:",
      "      - Assign ticket to agent: agent['active'] += 1.",
      "      - Record assignment {'ticket_id': t['id'], 'agent_id': agent['id']}.",
      "      - Remove ticket from pending queue.",
      "4. Return list of assignments made.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "FIFO Unskilled Queue",
        detail: "Dispatches first-in first-out without priority or skill matching.",
      },
      {
        level: "Level 1",
        title: "Priority-Ranked Queue",
        detail: "Orders tickets by severity (P0 to P3) but ignores agent skill specialization.",
      },
      {
        level: "Level 2",
        title: "Skill-Matched Throttled Dispatcher",
        detail: "Combines priority queues with agent skill subset checks and capacity limits.",
      },
      {
        level: "Level 3",
        title: "Enterprise SLA Engine",
        detail: "Adds dynamic starvation aging, escalation policies, and calendar shift handovers.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "ticket_router.py",
        code: `class TicketRouter:
    def __init__(self, agents: list[dict]) -> None:
        self.agents = agents  # list of {"id": str, "skills": set[str], "capacity": int, "active": int}
        self.queue: list[dict] = []

    def add_ticket(self, ticket: dict) -> None:
        self.queue.append(ticket)
        # Priority order: lower number is higher priority (0 > 1 > 2 > 3)
        self.queue.sort(key=lambda t: (t["priority"], t.get("created_at", 0)))

    def dispatch(self) -> list[dict]:
        assignments = []
        unassigned = []

        for ticket in self.queue:
            req_skills = set(ticket.get("skills", []))
            assigned = False
            for agent in self.agents:
                agent_skills = set(agent.get("skills", []))
                if req_skills.issubset(agent_skills) and agent["active"] < agent["capacity"]:
                    agent["active"] += 1
                    assignments.append({"ticket_id": ticket["id"], "agent_id": agent["id"]})
                    assigned = True
                    break
            if not assigned:
                unassigned.append(ticket)

        self.queue = unassigned
        return assignments`,
        explanations: [
          {
            code: 'self.queue.sort(key=lambda t: (t["priority"], t.get("created_at", 0)))',
            explanation: "Ensures highest priority (P0) and earliest arrivals are processed first.",
          },
          {
            code: 'if req_skills.issubset(agent_skills) and agent["active"] < agent["capacity"]:',
            explanation: "Validates both skill competence and agent workload capacity.",
          },
          {
            code: 'agent["active"] += 1; assignments.append(...)',
            explanation: "Records assignment and increments agent capacity utilization.",
          },
        ],
      },
    ],
    simulationNote: "Simulates support ticket triage and skill dispatch in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Starvation Threat",
      brief:
        "Explain what happens to a P3 ticket if P0 and P1 tickets arrive continuously at a faster rate than agents can resolve them.",
    },
    {
      level: "Modify",
      title: "Priority Aging",
      brief:
        "Implement a tick() method that reduces the priority number of any ticket waiting more than 60 minutes, promoting it to a higher tier.",
    },
    {
      level: "Build",
      title: "Agent Ticket Resolution",
      brief:
        "Add a resolve_ticket(agent_id, ticket_id) method that decrements the agent's active count and triggers an immediate dispatch cycle.",
    },
    {
      level: "Think",
      title: "Round-Robin Among Equals",
      brief:
        "If two agents both have the required skills and available capacity, which agent should be chosen to ensure balanced workloads?",
    },
  ],
  reflection: [
    "Why must priority dispatch account for both severity level and creation time?",
    "How does skill tag subset matching prevent support ticket bouncing?",
    "What architectural safeguards prevent ticket starvation in production support systems?",
  ],
  techNotes: [
    {
      name: "Heapq vs Sorted List",
      kind: "Complexity",
      note: "In production, using Python's `heapq` module provides O(log N) push and pop operations instead of re-sorting the entire list on every insertion.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Dispatch High-Priority Tickets to Skilled Agents",
    brief:
      "Implement `dispatch_support_tickets`: given a list of `tickets` `[{'id': str, 'priority': int, 'created_at': int, 'skills': list[str]}]` and a list of `agents` `[{'id': str, 'skills': list[str], 'capacity': int, 'active': int}]`, sort tickets by priority (ascending, where 0 is most urgent) and timestamp, match each ticket to the first agent possessing all required skills whose active count is below capacity, and return a list of assignment dictionaries `{'ticket_id': str, 'agent_id': str}`. Update agent active counts as tickets are assigned.",
    functionName: "dispatch_support_tickets",
    signature:
      "def dispatch_support_tickets(tickets: list[dict], agents: list[dict]) -> list[dict]:",
    starterCode: `def dispatch_support_tickets(tickets: list[dict], agents: list[dict]) -> list[dict]:
    # tickets: [{"id": str, "priority": int, "created_at": int, "skills": list[str]}]
    # agents: [{"id": str, "skills": list[str], "capacity": int, "active": int}]
    # Return list of {"ticket_id": str, "agent_id": str}
    sorted_tickets = sorted(tickets, key=lambda t: (t.get("priority", 3), t.get("created_at", 0)))
    assignments = []

    for t in sorted_tickets:
        req_skills = set(t.get("skills", []))
        for a in agents:
            agent_skills = set(a.get("skills", []))
            if req_skills.issubset(agent_skills) and a.get("active", 0) < a.get("capacity", 0):
                a["active"] = a.get("active", 0) + 1
                assignments.append({"ticket_id": t["id"], "agent_id": a["id"]})
                break

    return assignments
`,
    javaSignature:
      "public static List<Map<String, String>> dispatchSupportTickets(List<Map<String, Object>> tickets, List<Map<String, Object>> agents)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static List<Map<String, String>> dispatchSupportTickets(
        List<Map<String, Object>> tickets,
        List<Map<String, Object>> agents
    ) {
        List<Map<String, Object>> sortedTickets = new ArrayList<>(tickets);
        sortedTickets.sort((a, b) -> {
            int pA = ((Number) a.getOrDefault("priority", 3)).intValue();
            int pB = ((Number) b.getOrDefault("priority", 3)).intValue();
            if (pA != pB) return Integer.compare(pA, pB);
            long tA = ((Number) a.getOrDefault("created_at", 0)).longValue();
            long tB = ((Number) b.getOrDefault("created_at", 0)).longValue();
            return Long.compare(tA, tB);
        });

        List<Map<String, String>> assignments = new ArrayList<>();

        for (Map<String, Object> t : sortedTickets) {
            List<String> reqList = (List<String>) t.getOrDefault("skills", Collections.emptyList());
            Set<String> reqSkills = new HashSet<>(reqList);

            for (Map<String, Object> a : agents) {
                List<String> aList = (List<String>) a.getOrDefault("skills", Collections.emptyList());
                Set<String> aSkills = new HashSet<>(aList);
                int active = ((Number) a.getOrDefault("active", 0)).intValue();
                int cap = ((Number) a.getOrDefault("capacity", 0)).intValue();

                if (aSkills.containsAll(reqSkills) && active < cap) {
                    a.put("active", active + 1);
                    Map<String, String> assign = new HashMap<>();
                    assign.put("ticket_id", (String) t.get("id"));
                    assign.put("agent_id", (String) a.get("id"));
                    assignments.add(assign);
                    break;
                }
            }
        }

        return assignments;
    }
}`,
    mermaid: `graph TD
    Start["dispatch_support_tickets(tickets, agents)"] --> Sort["Sort tickets by (priority ASC, created_at ASC)"]
    Sort --> LoopT["For each ticket in sorted list"]
    LoopT --> LoopA["Find matching agent"]
    LoopA --> CheckSkill{"req_skills is subset of agent_skills?"}
    CheckSkill -->|"No"| NextA["Check next agent"]
    CheckSkill -->|"Yes"| CheckCap{"active < capacity?"}
    CheckCap -->|"No"| NextA
    CheckCap -->|"Yes"| Assign["active += 1 & record assignment"]
    Assign --> NextT{"More tickets?"}
    NextA --> AnyA{"More agents?"}
    AnyA -->|"Yes"| LoopA
    AnyA -->|"No"| NextT
    NextT -->|"Yes"| LoopT
    NextT -->|"No"| Done["Return assignments"]
`,
    hints: [
      "Remember that lower priority integers (e.g. 0) represent higher urgency.",
      "Use set.issubset() to verify agent possesses all required skills.",
      "Increment agent['active'] immediately upon making an assignment.",
    ],
    tests: [
      {
        name: "P0 takes precedence over earlier P2 ticket",
        args: [
          [
            { id: "T1", priority: 2, created_at: 100, skills: ["billing"] },
            { id: "T2", priority: 0, created_at: 150, skills: ["billing"] },
          ],
          [{ id: "A1", skills: ["billing"], capacity: 1, active: 0 }],
        ],
        expected: [{ ticket_id: "T2", agent_id: "A1" }],
      },
      {
        name: "Agent skill mismatch prevents assignment",
        args: [
          [{ id: "T1", priority: 0, created_at: 100, skills: ["database", "linux"] }],
          [
            { id: "A1", skills: ["billing"], capacity: 5, active: 0 },
            { id: "A2", skills: ["database"], capacity: 5, active: 0 }, // Missing linux
          ],
        ],
        expected: [],
      },
      {
        name: "Agent capacity ceiling respected",
        args: [
          [
            { id: "T1", priority: 1, created_at: 100, skills: ["network"] },
            { id: "T2", priority: 1, created_at: 110, skills: ["network"] },
          ],
          [
            { id: "A1", skills: ["network"], capacity: 1, active: 0 },
            { id: "A2", skills: ["network"], capacity: 2, active: 0 },
          ],
        ],
        expected: [
          { ticket_id: "T1", agent_id: "A1" },
          { ticket_id: "T2", agent_id: "A2" },
        ],
      },
    ],
    explanationPrompt:
      "Explain how your priority router enforces severity order, verifies multi-skill competence, and respects agent workload capacity limits.",
  },
};

// ----------------------------------------------------------------------------
// Case 41: Online MCQ Exam & Proctoring System
// ----------------------------------------------------------------------------
export const case41_mcqProctoring = {
  id: "cs-mcq-proctoring-041",
  slug: "online-mcq-proctoring-system",
  index: "41",
  title:
    "How Does a High-Concurrency Online Exam System Ingest Submissions and Flag Proctoring Anomalies?",
  shortTitle: "Online MCQ Exam System",
  category: "Web & Edge Systems",
  subcategory: "Live Assessment & Proctoring Anomalies",
  difficulty: "Intermediate",
  learnerLevel: "Builder",
  estimatedTime: "55-70 minutes",
  minutes: 60,
  status: "published",
  tier: "premium",
  rcCost: 50,
  summary:
    "When 100,000 students submit their final exam answers in the last 60 seconds of a national test, exam servers face extreme write spikes while proctoring watchdogs detect tab switches and out-of-order timestamps. Discover how high-scale assessment engines buffer submissions and detect anomalous test behaviors.",
  learningObjectives: [
    "Design high-throughput ingestion pipelines for synchronized exam closing spikes.",
    "Enforce exam submission time-window validity with server-authoritative timestamps.",
    "Implement anomaly detection algorithms to flag suspicious tab switches and multi-device logins.",
    "Score student answer batches against correct answer keys with negative marking rules.",
  ],
  prerequisites: [
    "Client-Server architecture and HTTP timestamp headers",
    "Dictionary data structures and scoring arithmetic",
    "Basic sliding window and anomaly detection heuristics",
  ],
  engineeringConcepts: [
    "Server-Authoritative Time Windows",
    "Buffered Batch Ingestion",
    "Proctoring Anomaly Scoring",
    "Negative Marking Evaluation",
    "Idempotent Submission Dedup",
  ],
  technologies: ["Python", "Java", "Redis", "Kafka", "WebSockets"],
  tech: ["Distributed Queue", "Anomaly Detection", "Scoring Engine"],
  tags: ["exam", "proctoring", "system design", "intermediate", "scale"],
  glossary: [
    {
      term: "Server-Authoritative Time Windows",
      plainDefinition:
        "Using server clocks rather than user device clocks to determine if an exam submission arrived before the hard deadline.",
    },
    {
      term: "Buffered Batch Ingestion",
      plainDefinition:
        "Absorbing huge submission spikes into a distributed message buffer before processing scores.",
    },
    {
      term: "Proctoring Anomaly Scoring",
      plainDefinition:
        "Aggregating telemetry flags (tab switching, focus loss, out-of-order events) to identify cheating risk.",
    },
    {
      term: "Negative Marking Evaluation",
      plainDefinition:
        "Awarding positive points for correct answers, zero for unattempted, and subtracting fractional penalties for incorrect answers.",
    },
    {
      term: "Idempotent Submission Dedup",
      plainDefinition:
        "Ensuring duplicate submit clicks during network lag update the same submission record without double counting.",
    },
  ],
  primers: [
    {
      concept: "Server-Authoritative Deadline Check",
      minutes: 4,
      definition:
        "Never trust the student's laptop clock; client clocks can easily be altered backwards by 10 minutes. Evaluate validity using the server's NTP-synchronized arrival timestamp.",
      whyNeeded:
        "Prevent dishonest users from bypassing test time limits by manipulating system clocks.",
      analogy:
        "The postal postmark stamp applied by the post office branch determines if a mailed tax form was sent on time, not the date written on the letter.",
      tinyExample: "is_valid = server_received_time <= (exam_end_time + GRACE_PERIOD_SEC)",
    },
    {
      concept: "MCQ Negative Marking Math",
      minutes: 4,
      definition:
        "In competitive exams, guessing is discouraged by subtracting penalties (e.g. -0.25) for wrong answers while awarding +1.0 for correct answers.",
      whyNeeded: "Deters random guessing and measures true knowledge certainty.",
      analogy: "A penalty box in sports: committing an error costs points.",
      tinyExample: "if ans == correct: score += 1.0\nelif ans is not None: score -= penalty",
    },
  ],
  discover: {
    situation:
      "A national competitive testing agency hosted an exam for 150,000 engineering students. When the 3-hour timer expired, 90% of students clicked 'Submit Final Exam' simultaneously. The database crashed under write contention, losing 8,000 submissions. Simultaneously, thousands of candidates exploited client clock manipulation and unfocused browser tabs without detection.",
    humanFlow: [
      "Student launches locked proctoring browser session and answers 50 questions.",
      "Browser streams periodic telemetry pings (tab switches, webcam gaze alerts).",
      "Student submits final answers at or before the exam closing deadline.",
      "Ingestion pipeline verifies server timestamp and buffers answers in an append log.",
      "Scoring service grades answers against answer key and calculates proctoring anomaly score.",
    ],
    question:
      "How do you design an exam submission and proctoring engine that handles synchronized finish-line write surges, validates deadlines server-side, and flags behavioral cheating anomalies?",
    whyItExists: [
      "Exam credibility requires 100% submission persistence even under massive concurrent write spikes.",
      "Server-authoritative timing prevents clock tampering fraud.",
      "Automated proctoring anomaly detection flags bad actors among tens of thousands of simultaneous examinees.",
    ],
  },
  understand: {
    overview:
      "The Online Exam System separates Answer Ingestion from Scoring and Proctoring Analysis. Submissions land on a stateless gateway that validates server deadlines and writes raw answers to an append-only queue. An asynchronous Scoring Worker evaluates answers against the key with negative marking, while a Telemetry Analyzer counts tab-switches and window blurs to produce an anomaly risk rating.",
    components: [
      {
        name: "Submission Ingestion Gateway",
        whatIsIt: "Stateless HTTP/WebSocket endpoint receiving final answer bundles.",
        whyItExists: "Absorbs connection spikes and verifies deadlines using server time.",
        whatItDoes: "Validates timestamp <= deadline + grace period and pushes to Kafka queue.",
      },
      {
        name: "Grading Engine",
        whatIsIt:
          "Worker service evaluating submitted question answers against the canonical answer key.",
        whyItExists:
          "Computes raw scores, correct counts, incorrect counts, and negative penalties.",
        whatItDoes: "Calculates total = (correct * weight) - (incorrect * penalty).",
      },
      {
        name: "Proctoring Telemetry Monitor",
        whatIsIt: "Analyzer parsing client browser event streams (focus loss, full-screen exit).",
        whyItExists:
          "Identifies test integrity violations without requiring human proctors for every single screen.",
        whatItDoes:
          "Calculates an anomaly index and flags candidates exceeding violation thresholds.",
      },
      {
        name: "Exam Ledger Database",
        whatIsIt: "Durable database persisting finalized scorecards and proctoring flags.",
        whyItExists: "Stores official examination transcripts.",
        whatItDoes: "Serves audit reports and student scorecards.",
      },
    ],
    analogy: {
      title: "Standardized Testing in a Physical Hall with Security Cameras",
      everyday: [
        "In a physical exam hall, when the proctor calls 'Pencils down!', an official clock determines the stop time.",
        "Students drop answer sheets into a secure intake collection box (Buffered Ingestion).",
        "An optical mark reader (OMR) machine scans sheets later to score points and penalties (Grading Engine).",
        "Security cameras review recordings of students who looked sideways or whispered (Proctoring Telemetry).",
      ],
      technical: [
        "Proctor calling 'Pencils down' corresponds to Server-Authoritative Deadline Check.",
        "Intake collection box corresponds to the Message Queue Buffer.",
        "OMR scanning corresponds to the Automated MCQ Scoring Engine.",
        "Security camera review corresponds to Proctoring Anomaly Telemetry Scoring.",
      ],
    },
    flow: [
      "Student submits answer bundle: student_id, answers map, telemetry events, client_time.",
      "Server assigns server_timestamp = now().",
      "If server_timestamp > exam_deadline + grace_period: reject with 'SUBMISSION_DEADLINE_EXCEEDED'.",
      "Score answers: for each question in answer_key:",
      "  - if answer == correct: score += correct_points.",
      "  - else if answer != None: score -= penalty_points.",
      "Count proctoring anomalies: count tab switches and blur events.",
      "If anomaly count > threshold: flag candidate as 'SUSPICIOUS_REVIEW_REQUIRED'.",
      "Return result summary: score, correct_count, incorrect_count, is_flagged.",
    ],
  },
  concepts: [
    {
      id: "concept-authoritative-time",
      name: "Server-Authoritative Time Check",
      difficulty: "Intermediate",
      simpleDefinition:
        "Validating time-sensitive actions using centralized server clocks rather than user device clocks.",
      whyItExists:
        "Clients can modify their local clocks or spoof client-generated timestamps in HTTP headers.",
      realWorldAnalogy:
        "The casino dealer announcing 'no more bets' when the roulette ball is spun.",
      technicalExplanation:
        "Check: server_now <= deadline + grace_period. Grace period absorbs network transit latency (e.g. 5-10 seconds).",
      caseApplication:
        "Protects exam integrity against candidates trying to submit answers after official test conclusion.",
      commonMistakes: [
        "Trusting request.body.timestamp generated by client JavaScript.",
        "Having no network grace period, penalizing students on poor 3G connections whose packets take 2 seconds to transit.",
      ],
      practice: [
        "Why is a 5-second grace period necessary on mobile networks?",
        "How do NTP servers keep a fleet of 50 exam ingestion servers synchronized within 5 milliseconds?",
      ],
    },
    {
      id: "concept-negative-marking",
      name: "Negative Marking Score Math",
      difficulty: "Intermediate",
      simpleDefinition:
        "Deducting points for incorrect answers to neutralize the expected value of random guessing.",
      whyItExists:
        "On a 4-choice MCQ test, pure guessing yields 25% correct by probability. A -0.25 penalty brings expected value to 0.",
      realWorldAnalogy:
        "In trivia games, wrong answers lose points to prevent contestants from shouting random guesses.",
      technicalExplanation:
        "Score = (num_correct * correct_val) - (num_incorrect * penalty_val). Unanswered questions suffer no penalty.",
      caseApplication: "Standard competitive entrance exam scoring formula.",
      commonMistakes: [
        "Penalizing unattempted questions.",
        "Using integer division causing fractional penalties to be truncated to zero.",
      ],
      practice: [
        "If a test has 100 questions (+4 for correct, -1 for wrong), what is the score for 70 correct, 20 wrong, 10 unattempted?",
        "What is the mathematical expected score of a student who randomly guesses all 100 questions?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Online MCQ Exam & Proctoring System highlighting write buffering and anomaly scoring.",
    levels: [
      {
        title: "Level 1: System Ingestion Flow",
        description: "Student submit flow through Ingestion Gateway, Queue, and Grading Engine.",
        mermaid: `graph TD
    Student["100,000 Students"] -->|"Submit Answers (Final 60s)"| Gateway["Ingestion Gateway"]
    Gateway -->|"Verify Server Deadline"| DeadlineCheck{"Server Time <= Deadline?"}
    DeadlineCheck -->|"No"| Expired["Reject: Deadline Exceeded"]
    DeadlineCheck -->|"Yes"| Queue["Kafka / SQS Submission Buffer"]
    Queue -->|"Process Batches"| GradingService["Grading & Anomaly Engine"]
    GradingService -->|"Persist Results"| ExamDB["Exam Results DB"]
`,
      },
      {
        title: "Level 2: Grading & Telemetry Evaluation",
        description: "Scoring engine and telemetry analyzer components.",
        mermaid: `graph TD
    RawSubmission["Raw Submission"] --> Split{"Split Payload"}
    Split --> Answers["Answer Key Matcher"]
    Split --> Telemetry["Proctoring Event Parser"]
    Answers --> Score["Calculate (Correct * 1) - (Wrong * Penalty)"]
    Telemetry --> AnomalyCount["Count Tab-Switches & Window Blurs"]
    Score --> Merge["Merge Scorecard"]
    AnomalyCount --> Merge
    Merge --> FlagCheck{"Anomaly Count >= Threshold?"}
    FlagCheck -->|"Yes"| Flagged["Set is_flagged = True"]
    FlagCheck -->|"No"| Clear["Set is_flagged = False"]
`,
      },
      {
        title: "Level 3: Telemetry Anomaly Detection",
        description: "Detailed event parsing for cheating detection.",
        mermaid: `graph TD
    Events["Stream of Client Events"] --> WindowCheck{"Event inside exam window?"}
    WindowCheck -->|"No"| Discard["Discard Out-of-Window Event"]
    WindowCheck -->|"Yes"| EventType{"Event Type"}
    EventType -->|"TAB_SWITCH"| AddTab["anomaly_score += 2"]
    EventType -->|"BLUR_WINDOW"| AddBlur["anomaly_score += 1"]
    EventType -->|"FULLSCREEN_EXIT"| AddFS["anomaly_score += 3"]
    AddTab --> CheckTotal{"anomaly_score > 5?"}
    AddBlur --> CheckTotal
    AddFS --> CheckTotal
    CheckTotal -->|"Yes"| TriggerAudit["Mark for Manual Proctor Video Audit"]
`,
      },
    ],
  },
  decisions: [
    {
      title: "Asynchronous Queue Buffering for Exam Submissions",
      what: "Write raw answer submissions directly to a message queue (Kafka/Redis Stream) instead of performing synchronous database writes and immediate scoring.",
      why: "100,000 simultaneous submissions in 60 seconds would saturate relational database connection pools and crash the exam.",
      problemSolved:
        "Prevents database write lock starvation and 504 Gateway Timeouts during the synchronized closing minutes.",
      withoutIt:
        "Thousands of student submissions fail to save, creating legal liability and cancelled test sessions.",
      alternatives: [
        "Synchronous direct database insert with read-after-write scoring.",
        "Client-side peer-to-peer collection.",
      ],
      tradeoff:
        "Scores are not displayed instantaneously; students see a 'Submission Received' confirmation while background workers compute grades over the next few minutes.",
    },
    {
      title: "Server-Authoritative Clock with 10-Second Network Grace Period",
      what: "Measure submission validity against server wall clock time, allowing a 10-second grace buffer.",
      why: "Eliminates client-side clock tampering while preventing unfair rejection of submissions delayed by mobile network packets.",
      problemSolved:
        "Protects test integrity from cheated client timestamps while remaining fair to users on poor internet connections.",
      withoutIt:
        "Cheaters change laptop clock back by 30 minutes to finish tests, while honest students on high-latency Wi-Fi are rejected.",
      alternatives: [
        "Strict 0-second hard cutoff on server clock.",
        "Trusting client-reported submit timestamps.",
      ],
      tradeoff: "Technically allows an extra 10 seconds of answer time to fast-connection users.",
    },
  ],
  implementation: {
    behaviour:
      "An ExamEvaluationService class that validates submission deadlines, grades answer sheets with negative marking, and calculates proctoring anomaly flags.",
    algorithm: [
      "1. Check server deadline: if server_timestamp > exam_deadline + grace_period_sec, return {'status': 'REJECTED_DEADLINE_EXCEEDED'}.",
      "2. Initialize correct_count = 0, incorrect_count = 0, unattempted_count = 0, total_score = 0.0.",
      "3. For question_id, correct_ans in answer_key.items():",
      "   a. user_ans = submitted_answers.get(question_id)",
      "   b. if user_ans is None or user_ans == '': unattempted_count += 1",
      "   c. elif user_ans == correct_ans: correct_count += 1; total_score += points_per_correct",
      "   d. else: incorrect_count += 1; total_score -= penalty_per_incorrect",
      "4. Calculate anomaly score from proctoring events: sum event weights (e.g. TAB_SWITCH = 2, BLUR = 1).",
      "5. is_flagged = (anomaly_score >= anomaly_threshold).",
      "6. Return {'status': 'ACCEPTED', 'score': round(total_score, 2), 'correct': correct_count, 'incorrect': incorrect_count, 'is_flagged': is_flagged}.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Naive In-Memory Grader",
        detail: "Direct string comparison of answers with no negative marking or deadline check.",
      },
      {
        level: "Level 1",
        title: "Negative Marking Grader",
        detail: "Adds fractional penalties for wrong answers and handles unattempted questions.",
      },
      {
        level: "Level 2",
        title: "Server Deadline & Anomaly Evaluator",
        detail:
          "Enforces server-authoritative time windows with network grace and tab-switch telemetry flags.",
      },
      {
        level: "Level 3",
        title: "High-Scale Distributed Assessment Platform",
        detail:
          "Decouples ingestion via Kafka queues, performs sharded parallel grading, and streams webcam ML flags.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "exam_grader.py",
        code: `class ExamEvaluator:
    @staticmethod
    def evaluate(
        answers: dict[str, str],
        answer_key: dict[str, str],
        server_time: float,
        deadline: float,
        telemetry: list[str],
        points_correct: float = 4.0,
        penalty_wrong: float = 1.0,
        grace_sec: float = 10.0,
        anomaly_threshold: int = 3
    ) -> dict:
        if server_time > (deadline + grace_sec):
            return {"status": "REJECTED_DEADLINE_EXCEEDED", "score": 0.0, "is_flagged": False}

        correct = 0
        wrong = 0
        score = 0.0

        for q_id, correct_ans in answer_key.items():
            user_ans = answers.get(q_id)
            if user_ans is None or user_ans == "":
                continue
            elif user_ans == correct_ans:
                correct += 1
                score += points_correct
            else:
                wrong += 1
                score -= penalty_wrong

        # Anomaly scoring: TAB_SWITCH and BLUR count as suspicious actions
        anomaly_count = sum(1 for e in telemetry if e in ("TAB_SWITCH", "WINDOW_BLUR", "FULLSCREEN_EXIT"))
        is_flagged = anomaly_count >= anomaly_threshold

        return {
            "status": "ACCEPTED",
            "score": round(score, 2),
            "correct": correct,
            "wrong": wrong,
            "is_flagged": is_flagged
        }`,
        explanations: [
          {
            code: 'if server_time > (deadline + grace_sec): return {"status": "REJECTED_DEADLINE_EXCEEDED"...}',
            explanation:
              "Enforces the server deadline with a 10-second network transit grace buffer.",
          },
          {
            code: "elif user_ans == correct_ans: correct += 1; score += points_correct",
            explanation: "Awards positive points for matched answers.",
          },
          {
            code: "else: wrong += 1; score -= penalty_wrong",
            explanation: "Subtracts negative marking penalty for incorrect selections.",
          },
        ],
      },
    ],
    simulationNote:
      "Models the core evaluation and telemetry scoring pipeline of a live examination platform.",
  },
  practice: [
    {
      level: "Understand",
      title: "Grace Period Security",
      brief:
        "Why must the grace period be strictly limited to network transit times (5-10s) rather than allowing 5 minutes?",
    },
    {
      level: "Modify",
      title: "Add Question Weighting",
      brief:
        "Modify the scoring loop to support variable points per question (e.g. 2 marks for section A, 4 marks for section B).",
    },
    {
      level: "Build",
      title: "Idempotent Submission Store",
      brief:
        "Implement a submission deduplicator that uses student_id as an idempotency key, ignoring duplicate submit clicks.",
    },
    {
      level: "Think",
      title: "Webcam Gaze ML Telemetry",
      brief:
        "If a browser-based ML model detects eyes looking away from screen, how would you prevent lighting variations from causing false positives?",
    },
  ],
  reflection: [
    "Why must time-window validation in competitive online exams rely strictly on server-authoritative timestamps?",
    "How does asynchronous message queuing protect examination infrastructure during the synchronized final 60 seconds?",
    "What mathematical purpose does negative marking serve in multiple-choice assessments?",
  ],
  techNotes: [
    {
      name: "NTP Synchronization",
      kind: "Distributed Systems",
      note: "All web servers in an exam fleet must run `chrony` or `ntpd` to keep local clocks synchronized within sub-millisecond drift.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Grade MCQ Submissions and Flag Proctoring Violations",
    brief:
      "Implement `grade_exam_submission`: given `submitted_answers` (dict of question_id -> selected_option), `answer_key` (dict of question_id -> correct_option), `server_timestamp` (float), `deadline` (float), `telemetry_events` (list of str), `points_correct` (float), and `penalty_incorrect` (float). Allow a 10.0 second grace period past deadline. If past deadline + grace, return `{'status': 'EXPIRED', 'score': 0.0, 'is_flagged': False}`. Flag candidate if count of 'TAB_SWITCH' or 'WINDOW_BLUR' events >= 3. Return `{'status': 'ACCEPTED', 'score': float, 'correct': int, 'wrong': int, 'is_flagged': bool}`.",
    functionName: "grade_exam_submission",
    signature:
      "def grade_exam_submission(submitted_answers: dict, answer_key: dict, server_timestamp: float, deadline: float, telemetry_events: list[str], points_correct: float, penalty_incorrect: float) -> dict:",
    starterCode: `def grade_exam_submission(submitted_answers: dict, answer_key: dict, server_timestamp: float, deadline: float, telemetry_events: list[str], points_correct: float, penalty_incorrect: float) -> dict:
    # Grace period is 10.0 seconds
    if server_timestamp > (deadline + 10.0):
        return {"status": "EXPIRED", "score": 0.0, "is_flagged": False}

    correct = 0
    wrong = 0
    score = 0.0

    for q_id, correct_ans in answer_key.items():
        user_ans = submitted_answers.get(q_id)
        if user_ans is None or user_ans == "":
            continue
        elif user_ans == correct_ans:
            correct += 1
            score += points_correct
        else:
            wrong += 1
            score -= penalty_incorrect

    suspicious_count = sum(1 for e in telemetry_events if e in ("TAB_SWITCH", "WINDOW_BLUR"))
    is_flagged = suspicious_count >= 3

    return {
        "status": "ACCEPTED",
        "score": round(score, 2),
        "correct": correct,
        "wrong": wrong,
        "is_flagged": is_flagged
    }
`,
    javaSignature:
      "public static Map<String, Object> gradeExamSubmission(Map<String, String> submittedAnswers, Map<String, String> answerKey, double serverTimestamp, double deadline, List<String> telemetryEvents, double pointsCorrect, double penaltyIncorrect)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> gradeExamSubmission(
        Map<String, String> submittedAnswers,
        Map<String, String> answerKey,
        double serverTimestamp,
        double deadline,
        List<String> telemetryEvents,
        double pointsCorrect,
        double penaltyIncorrect
    ) {
        if (serverTimestamp > (deadline + 10.0)) {
            Map<String, Object> expired = new HashMap<>();
            expired.put("status", "EXPIRED");
            expired.put("score", 0.0);
            expired.put("is_flagged", false);
            return expired;
        }

        int correct = 0;
        int wrong = 0;
        double score = 0.0;

        for (Map.Entry<String, String> entry : answerKey.entrySet()) {
            String qId = entry.getKey();
            String correctAns = entry.getValue();
            String userAns = submittedAnswers.get(qId);

            if (userAns == null || userAns.isEmpty()) {
                continue;
            } else if (userAns.equals(correctAns)) {
                correct++;
                score += pointsCorrect;
            } else {
                wrong++;
                score -= penaltyIncorrect;
            }
        }

        int suspiciousCount = 0;
        for (String e : telemetryEvents) {
            if ("TAB_SWITCH".equals(e) || "WINDOW_BLUR".equals(e)) {
                suspiciousCount++;
            }
        }
        boolean isFlagged = suspiciousCount >= 3;

        Map<String, Object> result = new HashMap<>();
        result.put("status", "ACCEPTED");
        result.put("score", Math.round(score * 100.0) / 100.0);
        result.put("correct", correct);
        result.put("wrong", wrong);
        result.put("is_flagged", isFlagged);
        return result;
    }
}`,
    mermaid: `graph TD
    Start["grade_exam_submission(...)"] --> DeadlineCheck{"server_timestamp > deadline + 10.0?"}
    DeadlineCheck -->|"Yes"| RetExpired["Return status: EXPIRED, score: 0.0"]
    DeadlineCheck -->|"No"| ScoreLoop["Iterate answer_key items"]
    ScoreLoop --> MatchCheck{"user_ans == correct_ans?"}
    MatchCheck -->|"Unattempted"| NextQ["Skip to next question"]
    MatchCheck -->|"Yes"| AddCorrect["correct += 1, score += points_correct"]
    MatchCheck -->|"No"| AddWrong["wrong += 1, score -= penalty_incorrect"]
    AddCorrect --> NextQ
    AddWrong --> NextQ
    NextQ --> AnyMore{"More questions?"}
    AnyMore -->|"Yes"| ScoreLoop
    AnyMore -->|"No"| TelemetryCheck["Count TAB_SWITCH & WINDOW_BLUR events"]
    TelemetryCheck --> FlagCheck{"suspicious_count >= 3?"}
    FlagCheck -->|"Yes"| FlagTrue["is_flagged = True"]
    FlagCheck -->|"No"| FlagFalse["is_flagged = False"]
    FlagTrue --> Done["Return result dict"]
    FlagFalse --> Done
`,
    hints: [
      "Check server_timestamp against deadline + 10.0 before evaluating answers.",
      "Unanswered questions must not receive penalty deductions.",
      "Round score to 2 decimal places.",
    ],
    tests: [
      {
        name: "Normal accepted submission with positive score",
        args: [
          { Q1: "A", Q2: "B", Q3: "C" },
          { Q1: "A", Q2: "B", Q3: "D" },
          1000.0,
          1005.0,
          ["FOCUS_GAIN"],
          4.0,
          1.0,
        ],
        expected: {
          status: "ACCEPTED",
          score: 7.0, // 2 correct (+8), 1 wrong (-1)
          correct: 2,
          wrong: 1,
          is_flagged: false,
        },
      },
      {
        name: "Submission expired beyond grace period",
        args: [
          { Q1: "A" },
          { Q1: "A" },
          1025.0,
          1000.0, // Exceeded 1000 + 10 = 1010
          [],
          4.0,
          1.0,
        ],
        expected: {
          status: "EXPIRED",
          score: 0.0,
          is_flagged: false,
        },
      },
      {
        name: "Proctoring violation flagged due to tab switches",
        args: [
          { Q1: "A" },
          { Q1: "A" },
          1000.0,
          1005.0,
          ["TAB_SWITCH", "WINDOW_BLUR", "TAB_SWITCH"],
          4.0,
          1.0,
        ],
        expected: {
          status: "ACCEPTED",
          score: 4.0,
          correct: 1,
          wrong: 0,
          is_flagged: true,
        },
      },
    ],
    explanationPrompt:
      "Explain how your engine enforces server deadline validity with grace periods, evaluates negative marking scores, and identifies proctoring anomalies.",
  },
};

// ----------------------------------------------------------------------------
// Case 42: Tinder Geospatial Matchmaker
// ----------------------------------------------------------------------------
export const case42_tinderGeoMatch = {
  id: "cs-tinder-geomatch-042",
  slug: "tinder-geospatial-matchmaker",
  index: "42",
  title:
    "How Does a Proximity Matchmaking Engine Query Profiles Within Radius R and Detect Mutual Swipes?",
  shortTitle: "Geospatial Matchmaker",
  category: "Distributed Data & Storage",
  subcategory: "Geospatial Indexing & Swipe Match State",
  difficulty: "Intermediate",
  learnerLevel: "Builder",
  estimatedTime: "55-70 minutes",
  minutes: 60,
  status: "published",
  tier: "premium",
  rcCost: 50,
  summary:
    "Dating and local marketplace apps serve millions of recommendations based on geographic proximity (e.g. within 10 km) while processing millions of swipe actions per minute. Discover how geospatial indexing (Geo-Hashing / QuadTrees) filters candidates and detects instantaneous mutual matches.",
  learningObjectives: [
    "Design geospatial proximity queries using bounding boxes and Haversine distance calculations.",
    "Structure two-way swipe interactions (Right Swipe / Like vs Left Swipe / Pass).",
    "Detect mutual matches in O(1) time using bidirectional inverted indexes.",
    "Manage transient recommendation card decks with exclusion of previously swiped profiles.",
  ],
  prerequisites: [
    "Latitude and Longitude geographic coordinates",
    "Hash sets and inverted indexes",
    "Trigonometric distance calculation (Haversine formula)",
  ],
  engineeringConcepts: [
    "Geospatial Bounding Box",
    "Haversine Distance Filter",
    "Mutual Match Inverted Index",
    "Previously Swiped Exclusion Filter",
    "Transient Card Deck Caching",
  ],
  technologies: ["Python", "Java", "Redis Geo", "PostGIS", "WebSockets"],
  tech: ["GeoHash", "Redis", "Spatial Index"],
  tags: ["geospatial", "tinder", "matching", "system design", "intermediate"],
  glossary: [
    {
      term: "Geospatial Bounding Box",
      plainDefinition:
        "A fast rectangular latitude/longitude filter that prunes distant candidates before running exact distance math.",
    },
    {
      term: "Haversine Distance Filter",
      plainDefinition:
        "The mathematical formula computing great-circle spherical distance between two points on Earth.",
    },
    {
      term: "Mutual Match Inverted Index",
      plainDefinition:
        "Tracking directional likes (A likes B) so that when B likes A, a mutual match event is triggered instantly.",
    },
    {
      term: "Previously Swiped Exclusion Filter",
      plainDefinition:
        "Ensuring a user never sees the same profile twice once they have swiped left or right.",
    },
    {
      term: "Transient Card Deck Caching",
      plainDefinition:
        "Precomputing a batch of 20-50 local candidate profiles in memory for smooth mobile client rendering.",
    },
  ],
  primers: [
    {
      concept: "Haversine Great-Circle Distance",
      minutes: 4,
      definition:
        "The Earth is a sphere, so straight Euclidean distance (x2 - x1) is inaccurate for geographic coordinates. Haversine calculates true kilometers across Earth's curvature.",
      whyNeeded: "Prevents showing recommendations 50 km away when user asked for a 10 km radius.",
      analogy: "Measuring string pulled tightly along the surface of a basketball.",
      tinyExample:
        "import math\ndlat = math.radians(lat2 - lat1)\ndlon = math.radians(lon2 - lon1)\na = math.sin(dlat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlon/2)**2\ndist_km = 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))",
    },
    {
      concept: "Mutual Swipe Detection",
      minutes: 4,
      definition:
        "When User A swipes right on User B: check if (B, A) exists in the likes set. If yes, it's an instant mutual match! If no, record (A, B) in the likes set.",
      whyNeeded:
        "Users expect instant 'It's a Match!' animations without polling or server delays.",
      analogy: "Secret handshake: if both reach out their hands at the same time, they shake.",
      tinyExample: "if (b, a) in likes:\n    trigger_match(a, b)\nelse:\n    likes.add((a, b))",
    },
  ],
  discover: {
    situation:
      "A location-based dating app launched in a densely populated metropolitan area. Within two weeks, database queries running `SELECT * FROM users WHERE SQRT((lat1-lat2)^2 + (lon1-lon2)^2) < radius` consumed 100% database CPU, locking up all swipe operations. Meanwhile, users complained of seeing people they had already rejected three times.",
    humanFlow: [
      "User opens app: GPS sends current coordinates (lat, lon) and search radius (e.g. 15 km).",
      "Backend queries spatial index for candidates within radius, excluding previously swiped profiles.",
      "User swipes right (LIKE) on a profile.",
      "Backend records the like and checks if the other user already liked them.",
      "If mutual, system generates a MATCH notification and opens a direct chat channel.",
    ],
    question:
      "How do you design a proximity matchmaking engine that quickly discovers candidates within radius R and detects mutual swipe matches in O(1) time?",
    whyItExists: [
      "Spatial search over millions of coordinate pairs requires indexed pruning to avoid full table scans.",
      "Mutual match detection must execute in real time under heavy concurrent write loads.",
      "User experience requires clean deduplication of previously viewed profiles.",
    ],
  },
  understand: {
    overview:
      "The Geospatial Matchmaker uses a spatial distance filter combined with a bidirectional Swipe Ledger. When candidate decks are requested, candidates are filtered by Haversine distance and past swipe history. When a Right Swipe occurs, an O(1) hash lookup checks if the target already liked the actor; if so, a Match event is emitted immediately.",
    components: [
      {
        name: "Spatial Proximity Index",
        whatIsIt:
          "A geospatial store (such as Redis GEO or PostGIS) mapping user locations to coordinates.",
        whyItExists:
          "Filters candidate pools within distance radius R without scanning millions of rows.",
        whatItDoes: "Returns candidate user IDs located within bounding circle.",
      },
      {
        name: "Swipe Ledger Store",
        whatIsIt:
          "In-memory set storing directed swipe decisions: (actor_id, target_id, decision).",
        whyItExists: "Persists user preferences and supports instantaneous mutual match queries.",
        whatItDoes:
          "Stores like records and excludes seen profiles from future recommendation decks.",
      },
      {
        name: "Match Detector",
        whatIsIt: "The evaluation service triggered on every RIGHT_SWIPE.",
        whyItExists: "Checks if a symmetrical like already exists.",
        whatItDoes: "Emits a Match event if target has previously liked actor.",
      },
      {
        name: "Deck Generator",
        whatIsIt: "The feed curation worker that assembles batches of recommended profiles.",
        whyItExists: "Prepares card decks for smooth client pagination.",
        whatItDoes: "Filters nearby candidates against age, gender, and seen history.",
      },
    ],
    analogy: {
      title: "Speed Dating in Neighborhood Lounges",
      everyday: [
        "A speed dating event is hosted specifically for residents of a single neighborhood (Spatial Proximity).",
        "Each person holds a scorecard. If you like someone, you secretly mark a check next to their number.",
        "You never sit with someone you already spoke to in a previous round (Seen Exclusion Filter).",
        "At the end of the round, the host compares cards: if both people checked each other, they get each other's contact card (Mutual Match).",
      ],
      technical: [
        "Neighborhood boundary corresponds to Geospatial Radius Filter.",
        "Scorecard check corresponds to Directed Swipe Inverted Index.",
        "Host comparing cards corresponds to the Mutual Match Detector.",
      ],
    },
    flow: [
      "User requests card deck with current (lat, lon) and max_radius_km.",
      "System queries candidates within radius using Haversine formula.",
      "Filter out any candidate already swiped by the user.",
      "Return top candidates to client.",
      "User submits swipe: (actor_id, target_id, 'LIKE').",
      "System checks if (target_id, actor_id) exists in likes_set.",
      "If yes: create Match record and return {'is_match': True}.",
      "If no: record (actor_id, target_id) in likes_set and return {'is_match': False}.",
    ],
  },
  concepts: [
    {
      id: "concept-haversine",
      name: "Haversine Distance Metric",
      difficulty: "Intermediate",
      simpleDefinition:
        "The standard formula for calculating geodesic distance between two points on the curved surface of Earth.",
      whyItExists:
        "Flat Cartesian distance calculations distort significantly as latitude moves away from the equator.",
      realWorldAnalogy:
        "Measuring flight miles on a globe with a curved tape measure instead of a flat ruler.",
      technicalExplanation:
        "Uses spherical law of haversines with Earth mean radius R = 6371.0 km.",
      caseApplication:
        "Determines whether a potential match is within the student's selected 10 km campus filter.",
      commonMistakes: [
        "Passing degrees instead of radians into math.sin() and math.cos().",
        "Confusing latitude (y-axis, -90 to +90) with longitude (x-axis, -180 to +180).",
      ],
      practice: [
        "Calculate the approximate distance between (0, 0) and (0, 1) on the equator.",
        "Why does a bounding box filter accelerate spatial queries before applying Haversine?",
      ],
    },
    {
      id: "concept-mutual-match",
      name: "Bidirectional Match Invariant",
      difficulty: "Intermediate",
      simpleDefinition:
        "A match is formed if and only if both users have explicitly expressed interest in each other.",
      whyItExists:
        "Protects privacy and prevents unsolicited messaging until mutual attraction is confirmed.",
      realWorldAnalogy: "Both parties must accept a LinkedIn connection request before messaging.",
      technicalExplanation:
        "Match condition: (A -> B == LIKE) AND (B -> A == LIKE). Evaluated in O(1) using hash lookup.",
      caseApplication: "Triggers the celebration screen and unlocks the chat thread.",
      commonMistakes: [
        "Creating duplicate match records when B swipes on A after A already swiped on B.",
        "Allowing a LEFT swipe (pass) to trigger a match.",
      ],
      practice: [
        "How would you prevent duplicate match notifications if two users swipe right at the exact same millisecond?",
        "What data structure stores seen profiles to ensure O(1) exclusion filtering?",
      ],
    },
  ],
  architecture: {
    caption:
      "Architecture of the Tinder Geospatial Matchmaker highlighting spatial deck queries and O(1) mutual match detection.",
    levels: [
      {
        title: "Level 1: System Workflow",
        description: "Mobile App interacting with Geo Deck Query and Swipe Ingestion.",
        mermaid: `graph TD
    Client["User Mobile App"] -->|"1. Get Nearby Deck (lat, lon, r)"| DeckService["Deck Generator"]
    Client -->|"2. Submit Swipe (actor, target, LIKE)"| SwipeService["Swipe Ingestion Service"]
    DeckService -->|"Filter Radius & Exclude Seen"| SpatialDB["Spatial Store (Redis GEO)"]
    SwipeService -->|"Check Mutual Like"| MatchDetector["Match Detector"]
    MatchDetector -->|"Match Found!"| NotifService["WebSocket Match Push"]
`,
      },
      {
        title: "Level 2: Mutual Match Detection Pipeline",
        description: "Symmetrical lookup upon right swipe.",
        mermaid: `graph TD
    Swipe["Swipe Event (A -> B, LIKE)"] --> RecordSeen["Record seen (A, B)"]
    RecordSeen --> CheckCounter["Check if (B -> A) in Likes Set"]
    CheckCounter -->|"Yes"| CreateMatch["Create Match (A, B) & Notify Both"]
    CheckCounter -->|"No"| RecordLike["Record (A -> B) in Likes Set"]
`,
      },
      {
        title: "Level 3: Geospatial Bounding Box & Haversine Filter",
        description: "Two-stage spatial pruning for high-speed candidate filtering.",
        mermaid: `graph TD
    Request["Query(center_lat, center_lon, radius_km)"] --> Box["Fast Bounding Box (min_lat, max_lat, min_lon, max_lon)"]
    Box --> CandidatePool["Candidate Subset"]
    CandidatePool --> ExactCalc["Calculate Haversine Distance"]
    ExactCalc --> WithinRadius{"Distance <= radius_km?"}
    WithinRadius -->|"Yes"| SeenCheck{"Already swiped by user?"}
    WithinRadius -->|"No"| Discard["Discard"]
    SeenCheck -->|"No"| AddDeck["Include in Card Deck"]
    SeenCheck -->|"Yes"| Discard
`,
      },
    ],
  },
  decisions: [
    {
      title: "In-Memory Hash Set for Mutual Match Detection",
      what: "Store directed likes in an in-memory set (e.g. Redis set) keyed by (actor_id, target_id).",
      why: "Provides O(1) instant lookup to determine if the target has already liked the actor.",
      problemSolved:
        "Eliminates slow relational SQL queries (`SELECT * FROM likes WHERE user_id = B AND target_id = A`) on every swipe.",
      withoutIt: "Database locks up when thousands of users swipe right during peak evening hours.",
      alternatives: [
        "Relational database query with composite B-Tree indexes.",
        "Asynchronous batch matching worker (delayed match notification).",
      ],
      tradeoff: "Requires in-memory storage proportional to total historical active likes.",
    },
    {
      title: "Haversine Spherical Metric over Euclidean Approximation",
      what: "Calculate distance using the Haversine trigonometric formula with Earth radius 6371.0 km.",
      why: "Euclidean flat-earth approximation introduces severe longitudinal compression distortion outside equatorial regions.",
      problemSolved:
        "Prevents candidates at 45 degrees latitude from being shown outside their configured radius.",
      withoutIt: "Users in cities like London or New York experience 30%+ error in radius filters.",
      alternatives: [
        "Euclidean planar approximation: sqrt((lat1-lat2)^2 + (lon1-lon2)^2).",
        "Geohash prefix string matching alone.",
      ],
      tradeoff:
        "Trigonometric functions (sin, cos, atan2) consume more CPU cycles per distance calculation.",
    },
  ],
  implementation: {
    behaviour:
      "A GeospatialMatchmaker class that filters candidates within a geographic radius using Haversine distance and detects instantaneous mutual swipe matches.",
    algorithm: [
      "1. haversine_distance: calculate spherical distance in km between (lat1, lon1) and (lat2, lon2).",
      "2. get_candidate_deck: given user_id, user_lat, user_lon, max_radius_km, candidates_list:",
      "   a. Filter out candidate if candidate['id'] == user_id or candidate['id'] in seen_swipes[user_id].",
      "   b. Calculate dist = haversine_distance(user_lat, user_lon, candidate['lat'], candidate['lon']).",
      "   c. If dist <= max_radius_km, include candidate in deck.",
      "3. process_swipe: given actor_id, target_id, action ('LIKE' or 'PASS'):",
      "   a. Record target_id in seen_swipes[actor_id].",
      "   b. If action == 'LIKE':",
      "      - Check if (target_id, actor_id) in likes_set.",
      "      - If yes: return {'is_match': True}.",
      "      - If no: add (actor_id, target_id) to likes_set; return {'is_match': False}.",
      "   c. Else (PASS): return {'is_match': False}.",
    ],
    ladder: [
      {
        level: "Level 0",
        title: "Euclidean Distance Matcher",
        detail: "Flat Cartesian distance calculation without seen-profile filtering.",
      },
      {
        level: "Level 1",
        title: "Haversine Proximity Filter",
        detail:
          "Curvature-accurate spherical distance calculation with radius boundary enforcement.",
      },
      {
        level: "Level 2",
        title: "Mutual Match Detector",
        detail:
          "Bidirectional swipe ledger with instant mutual match detection and seen exclusions.",
      },
      {
        level: "Level 3",
        title: "Hyperscale Geospatial Sharding",
        detail:
          "Redis GEO geohash clustering, QuadTree partition cells, and WebSocket push notifications.",
      },
    ],
    samples: [
      {
        language: "python",
        filename: "geo_matchmaker.py",
        code: `import math

class GeoMatchmaker:
    def __init__(self) -> None:
        self.likes: set[tuple[str, str]] = set()
        self.seen: dict[str, set[str]] = {}

    @staticmethod
    def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0  # Earth radius in km
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)

        a = math.sin(dphi / 2.0)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2.0)**2
        return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    def get_deck(self, user_id: str, u_lat: float, u_lon: float, radius_km: float, profiles: list[dict]) -> list[str]:
        user_seen = self.seen.get(user_id, set())
        deck = []
        for p in profiles:
            p_id = p["id"]
            if p_id == user_id or p_id in user_seen:
                continue
            dist = self.haversine(u_lat, u_lon, p["lat"], p["lon"])
            if dist <= radius_km:
                deck.append(p_id)
        return deck

    def swipe(self, actor_id: str, target_id: str, action: str) -> bool:
        if actor_id not in self.seen:
            self.seen[actor_id] = set()
        self.seen[actor_id].add(target_id)

        if action == "LIKE":
            if (target_id, actor_id) in self.likes:
                return True  # Mutual match!
            self.likes.add((actor_id, target_id))
        return False`,
        explanations: [
          {
            code: 'dist = self.haversine(u_lat, u_lon, p["lat"], p["lon"])',
            explanation: "Calculates true spherical distance on Earth's curvature in kilometers.",
          },
          {
            code: "if (target_id, actor_id) in self.likes: return True",
            explanation: "Checks if target previously liked actor in O(1) hash set lookup.",
          },
          {
            code: "self.seen[actor_id].add(target_id)",
            explanation: "Excludes target from ever appearing in actor's card deck again.",
          },
        ],
      },
    ],
    simulationNote:
      "Simulates geospatial candidate filtering and mutual match detection in pure memory.",
  },
  practice: [
    {
      level: "Understand",
      title: "Geohash Bounding Box Pruning",
      brief:
        "Why is it common to query a geohash prefix cell before computing Haversine distance on candidates?",
    },
    {
      level: "Modify",
      title: "Add Rewind Feature",
      brief:
        "Implement a rewind() method that allows premium users to undo their last swipe and remove it from the seen set.",
    },
    {
      level: "Build",
      title: "Super Like Priority",
      brief:
        "Implement a 'SUPER_LIKE' swipe action that highlights the profile with a blue border at the very front of the target's deck.",
    },
    {
      level: "Think",
      title: "Location Privacy Obfuscation",
      brief:
        "Why do production dating apps avoid exposing a user's exact latitude and longitude to other clients, and how does fuzzy rounding protect user safety?",
    },
  ],
  reflection: [
    "Why is the Haversine formula necessary for geospatial queries compared to Euclidean distance?",
    "How does an inverted like set achieve O(1) mutual match detection under high traffic?",
    "What data structures prevent users from repeatedly seeing profiles they already swiped on?",
  ],
  techNotes: [
    {
      name: "Redis GEO",
      kind: "Industry Standard",
      note: "Redis uses 52-bit integer Geohashes under the hood with sorted sets (`GEOADD`, `GEORADIUS`), enabling sub-millisecond proximity queries across millions of coordinates.",
    },
  ],
  codeLab: {
    title: "Interactive Lab: Filter Profiles by Radius and Detect Mutual Matches",
    brief:
      "Implement `evaluate_geo_swipes`: given `user_location` `(lat, lon)`, `search_radius_km` (float), `candidates` `[{'id': str, 'lat': float, 'lon': float}]`, and `swipe_events` `[{'actor': str, 'target': str, 'action': 'LIKE'|'PASS'}]`. Return a dictionary with: `'nearby_candidates'` (list of candidate IDs within radius, sorted by distance ascending) and `'matches'` (list of sorted pairs `[min(a,b), max(a,b)]` where mutual likes occurred). Distance is calculated using the Haversine formula with R = 6371.0 km.",
    functionName: "evaluate_geo_swipes",
    signature:
      "def evaluate_geo_swipes(user_location: tuple[float, float], search_radius_km: float, candidates: list[dict], swipe_events: list[dict]) -> dict:",
    starterCode: `import math

def evaluate_geo_swipes(user_location: tuple[float, float], search_radius_km: float, candidates: list[dict], swipe_events: list[dict]) -> dict:
    u_lat, u_lon = user_location
    r = 6371.0

    def haversine(lat1, lon1, lat2, lon2):
        p1, p2 = math.radians(lat1), math.radians(lat2)
        dp = math.radians(lat2 - lat1)
        dl = math.radians(lon2 - lon1)
        a = math.sin(dp / 2.0)**2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0)**2
        return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    nearby = []
    for c in candidates:
        dist = haversine(u_lat, u_lon, c["lat"], c["lon"])
        if dist <= search_radius_km:
            nearby.append((c["id"], dist))

    nearby.sort(key=lambda x: x[1])
    nearby_ids = [item[0] for item in nearby]

    likes = set()
    matches = []
    for s in swipe_events:
        actor = s["actor"]
        target = s["target"]
        action = s["action"]
        if action == "LIKE":
            if (target, actor) in likes:
                pair = sorted([actor, target])
                if pair not in matches:
                    matches.append(pair)
            else:
                likes.add((actor, target))

    return {"nearby_candidates": nearby_ids, "matches": matches}
`,
    javaSignature:
      "public static Map<String, Object> evaluateGeoSwipes(List<Double> userLocation, double searchRadiusKm, List<Map<String, Object>> candidates, List<Map<String, String>> swipeEvents)",
    javaStarterCode: `import java.util.*;

public class Solution {
    public static Map<String, Object> evaluateGeoSwipes(
        List<Double> userLocation,
        double searchRadiusKm,
        List<Map<String, Object>> candidates,
        List<Map<String, String>> swipeEvents
    ) {
        double uLat = userLocation.get(0);
        double uLon = userLocation.get(1);

        List<Map.Entry<String, Double>> nearby = new ArrayList<>();
        for (Map<String, Object> c : candidates) {
            double cLat = ((Number) c.get("lat")).doubleValue();
            double cLon = ((Number) c.get("lon")).doubleValue();
            double dist = haversine(uLat, uLon, cLat, cLon);
            if (dist <= searchRadiusKm) {
                nearby.add(new AbstractMap.SimpleEntry<>((String) c.get("id"), dist));
            }
        }

        nearby.sort(Comparator.comparingDouble(Map.Entry::getValue));
        List<String> nearbyIds = new ArrayList<>();
        for (Map.Entry<String, Double> e : nearby) {
            nearbyIds.add(e.getKey());
        }

        Set<String> likes = new HashSet<>();
        List<List<String>> matches = new ArrayList<>();

        for (Map<String, String> s : swipeEvents) {
            String actor = s.get("actor");
            String target = s.get("target");
            String action = s.get("action");

            if ("LIKE".equals(action)) {
                String reverseKey = target + "->" + actor;
                if (likes.contains(reverseKey)) {
                    List<String> pair = Arrays.asList(actor, target);
                    Collections.sort(pair);
                    if (!matches.contains(pair)) {
                        matches.add(pair);
                    }
                } else {
                    likes.add(actor + "->" + target);
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("nearby_candidates", nearbyIds);
        result.put("matches", matches);
        return result;
    }

    private static double haversine(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371.0;
        double phi1 = Math.toRadians(lat1);
        double phi2 = Math.toRadians(lat2);
        double dphi = Math.toRadians(lat2 - lat1);
        double dlam = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dphi / 2.0) * Math.sin(dphi / 2.0)
                 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2.0) * Math.sin(dlam / 2.0);
        return 2.0 * r * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
    }
}`,
    mermaid: `graph TD
    Start["evaluate_geo_swipes(...)"] --> DistanceLoop["For each candidate: compute Haversine distance"]
    DistanceLoop --> DistCheck{"Distance <= search_radius_km?"}
    DistCheck -->|"Yes"| AddNearby["Add to nearby list"]
    DistCheck -->|"No"| NextC["Skip candidate"]
    AddNearby --> NextC
    NextC --> SortNearby["Sort nearby candidates ascending by distance"]
    SortNearby --> SwipeLoop["For each swipe event in swipe_events"]
    SwipeLoop --> LikeCheck{"action == 'LIKE'?"}
    LikeCheck -->|"No"| NextSwipe["Skip to next swipe"]
    LikeCheck -->|"Yes"| ReverseCheck{"(target, actor) in likes_set?"}
    ReverseCheck -->|"Yes"| RecordMatch["Add sorted [actor, target] to matches"]
    ReverseCheck -->|"No"| RecordLike["likes_set.add((actor, target))"]
    RecordMatch --> NextSwipe
    RecordLike --> NextSwipe
    NextSwipe --> Return["Return nearby_candidates and matches"]
`,
    hints: [
      "Use Haversine formula with earth radius 6371.0 to compute accurate kilometer distances.",
      "Sort candidate IDs ascending by distance.",
      "Record mutual matches as sorted pairs [min, max] when reciprocal like is detected.",
    ],
    tests: [
      {
        name: "Nearby filtering within 15 km and single mutual match",
        args: [
          [12.9716, 77.5946], // Bangalore center
          15.0,
          [
            { id: "U1", lat: 12.9352, lon: 77.6245 }, // Koramangala ~5 km
            { id: "U2", lat: 12.9784, lon: 77.6408 }, // Indiranagar ~5 km
            { id: "U3", lat: 13.1986, lon: 77.7066 }, // Airport ~30 km (out of radius)
          ],
          [
            { actor: "Alice", target: "Bob", action: "LIKE" },
            { actor: "Bob", target: "Alice", action: "LIKE" }, // Mutual match
          ],
        ],
        expected: {
          nearby_candidates: ["U1", "U2"],
          matches: [["Alice", "Bob"]],
        },
      },
      {
        name: "Pass action does not trigger match even if target liked",
        args: [
          [0.0, 0.0],
          50.0,
          [{ id: "U1", lat: 0.1, lon: 0.1 }],
          [
            { actor: "Alice", target: "Bob", action: "LIKE" },
            { actor: "Bob", target: "Alice", action: "PASS" },
          ],
        ],
        expected: {
          nearby_candidates: ["U1"],
          matches: [],
        },
      },
    ],
    explanationPrompt:
      "Explain how your matchmaker applies the Haversine formula to filter proximity decks and how it detects mutual matches in O(1) time using an inverted like index.",
  },
};

// ============================================================================
// Batch 4 Export & Runner
// ============================================================================
export const batch4Cases = [
  case36_attendanceTracker,
  case37_placementPortal,
  case38_splitwise,
  case39_chessEngine,
  case40_ticketRouting,
  case41_mcqProctoring,
  case42_tinderGeoMatch,
];

async function run() {
  let allPassed = true;
  console.log("=== Validating & Upserting Batch 4 (Cases 36 - 42) ===");
  for (const cs of batch4Cases) {
    console.log(`\nValidating Case ${cs.index}: ${cs.slug}...`);
    const report = validateCaseStudy(cs);
    if (!report.passed) {
      allPassed = false;
      console.error(`Quality Gate FAILED for ${cs.slug}:`);
      report.errors.forEach((e) => console.error(`  - ERROR: ${e}`));
      continue;
    }
    console.log(`Quality Gate PASSED for ${cs.slug}. Upserting to Convex DB...`);
    await upsertToConvex(cs);
  }
  console.log(
    allPassed
      ? "\n=== Batch 4 (Cases 36 - 42) Successfully Seeded to Convex DB! ==="
      : "\n=== Batch 4 FAILED — see errors above ===",
  );
  if (!allPassed) process.exit(1);
}

if (import.meta.main) {
  run().catch((err) => {
    console.error("Batch 4 Error:", err);
    process.exit(1);
  });
}
