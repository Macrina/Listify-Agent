# Quick Evaluation Template

Use this template to quickly evaluate LLM responses for the Listify Agent.

---

## Response Evaluation Form

**Date:** _____________
**Evaluator:** _____________
**Response ID:** _____________

### User Query
```
[Paste the user's question or request here]
```

### LLM Response Summary
```
[Brief summary of what the LLM did/said]
```

---

## 1. Tone Evaluation

**Rating:** ☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5

**Check all that apply:**
- ☐ Professional and appropriate
- ☐ Friendly and approachable
- ☐ Clear and concise
- ☐ Empathetic (when dealing with errors)
- ☐ Not condescending
- ☐ Encouraging and helpful

**Issues found:**
```
[List any tone issues]
```

**Example quote:**
```
[Quote specific text that demonstrates tone]
```

---

## 2. Tool Calling Evaluation

**Rating:** ☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5

**Tools Used:**
```
Tool 1: [name] - Purpose: [why]
Tool 2: [name] - Purpose: [why]
Tool 3: [name] - Purpose: [why]
```

**Check all that apply:**
- ☐ Correct tool selection
- ☐ Proper parameters
- ☐ Efficient (no redundant calls)
- ☐ Parallel calls when appropriate
- ☐ Read before Edit/Write
- ☐ No unnecessary Bash commands

**Issues found:**
- ☐ Wrong tool used
- ☐ Missing necessary tool
- ☐ Inefficient tool usage
- ☐ Dangerous operations (overwrites)
- ☐ Should use specialized tool instead of Bash

**Details:**
```
[Explain any tool calling issues]
```

---

## 3. Correctness Evaluation

**Rating:** ☐ 1  ☐ 2  ☐ 3  ☐ 4  ☐ 5

**Check all that apply:**
- ☐ Factually accurate
- ☐ Complete answer
- ☐ Addresses the actual question
- ☐ No hallucinations
- ☐ Technically correct
- ☐ Follows best practices
- ☐ Provides examples
- ☐ Cites specific files/lines

**Accuracy:**
- ☐ 100% accurate
- ☐ Mostly accurate (minor errors)
- ☐ Partially accurate
- ☐ Mostly inaccurate
- ☐ Completely wrong

**Issues found:**
- ☐ Incorrect file paths
- ☐ Hallucinated files/features
- ☐ Wrong technical approach
- ☐ Incomplete solution
- ☐ Misleading information
- ☐ Outdated information

**Details:**
```
[Explain any correctness issues]
```

**Did it solve the user's problem?**
- ☐ Yes, completely
- ☐ Partially
- ☐ No

---

## Overall Assessment

**Average Score:** _____ / 5

**Strengths:**
1.
2.
3.

**Weaknesses:**
1.
2.
3.

**Action Required:**
- ☐ Approve - Publish as-is
- ☐ Minor Revision - Small fixes needed
- ☐ Major Revision - Significant changes needed
- ☐ Reject - Complete rewrite required

**Recommended Changes:**
```
[List specific changes to make]
```

---

## Example Comparisons

**What the LLM said:**
```
[Paste actual response]
```

**What it SHOULD have said:**
```
[Write improved version]
```

---

## Categories Checklist

**For Reference - Common Issues:**

### Tone Issues:
- ☐ Too casual/unprofessional
- ☐ Too formal/robotic
- ☐ Condescending
- ☐ Impatient
- ☐ Overly verbose
- ☐ Dismissive of user concerns

### Tool Issues:
- ☐ Used Bash instead of Read
- ☐ Used Bash instead of Grep
- ☐ Used Write instead of Edit (overwrites!)
- ☐ Didn't read file before editing
- ☐ Made sequential calls that could be parallel
- ☐ Made unnecessary tool calls

### Correctness Issues:
- ☐ Wrong file path
- ☐ Non-existent file mentioned
- ☐ Wrong API/library usage
- ☐ Incorrect command syntax
- ☐ Incomplete instructions
- ☐ Skipped necessary steps
- ☐ Made up configuration options

---

## Notes
```
[Any additional notes or observations]
```

---

## Follow-up Actions

**Tasks:**
- ☐ Update response
- ☐ Add to training examples
- ☐ Document this pattern
- ☐ Create better prompts
- ☐ Update guidelines

**Assigned to:** _____________
**Due date:** _____________
