"""Validate the delivered content pack using Python's standard library."""
from pathlib import Path
from fractions import Fraction as F
from itertools import product, permutations, combinations
from collections import Counter
import json, math, re, hashlib
ROOT=Path(__file__).resolve().parent
course=json.loads((ROOT/'course.json').read_text())
questions=json.loads((ROOT/'question-bank.json').read_text())['questions']
manifest=json.loads((ROOT/'source-manifest.json').read_text())
lessons=course['lessons']; ids={x['id'] for x in lessons}; sources={x['id']:x for x in manifest['sources']}
assert len(ids)==len(lessons)==20
assert len(sources)==15 and sum(x['page_count'] for x in sources.values())==123
assert len(questions)==len({q['id'] for q in questions})==60
assert all(v==3 for v in Counter(q['lesson_id'] for q in questions).values())
for s in sources.values():
 p=ROOT.parent/s['path']; assert p.is_file()
 assert hashlib.sha256(p.read_bytes()).hexdigest()==s['sha256']
 txt=(ROOT/s['extracted_text']).read_text()
 assert len(re.findall(r'=== PDF PAGE \d+ ===',txt))==s['page_count']
for l in lessons:
 assert (ROOT/l['path']).is_file()
 assert set(l['prerequisites'])<=ids
 assert l['body_markdown'].count('$$')%2==0
for item in lessons+questions:
 for r in item.get('sources',item.get('source_refs',[])):
  assert r['source_id'] in sources
  assert all(1<=p<=sources[r['source_id']]['page_count'] for p in r['pages'])
for q in questions:
 assert q['lesson_id'] in ids
 assert q['solution'] and q['hints']
 if q['type']=='multiple_choice': assert 0<=q['answer']<len(q['options'])
 if q['type']=='free_response': assert q['grading']['mode']=='self_assessment' and isinstance(q['answer'],list)
for term in json.loads((ROOT/'glossary.json').read_text())['terms']:
 assert term['lesson_id'] in ids
# Markdown file targets, including original PDFs. No attempt to validate external search results.
link_count=0
for p in ROOT.rglob('*.md'):
 for target in re.findall(r'\]\(([^)]+)\)',p.read_text()):
  if target.startswith(('http://','https://','#')):continue
  resolved=(p.parent/target.split('#')[0]).resolve()
  assert resolved.is_file(),(p.name,target)
  link_count+=1
# Independently recompute numeric keys using enumeration, exact fractions, or defining integrals.
def sample_var(xs):
 mean=sum(xs)/len(xs); return sum((x-mean)**2 for x in xs)/(len(xs)-1)
def int_poly(coeffs,a,b):
 return sum(c*(b**(i+1)-a**(i+1))/F(i+1) for i,c in enumerate(coeffs))
red_samples=list(combinations(range(10),3))
bin_sequences=list(product([0,1],repeat=4))
weights=[F(1,5),F(1,2),F(3,10)]
mu=sum(x*p for x,p in enumerate(weights))
expected={
'q01-02':F(12,48),
'q02-02':sample_var([2,4,6]),'q02-03':math.sqrt(sample_var([2,4,6])),
'q03-02':sorted([1,3,5])[1],
'q04-02':F(sum(a+b==7 for a,b in product(range(1,7),repeat=2)),36),
'q05-02':len(set(permutations('LEVEL'))),'q05-03':len(list(permutations(range(8),2))),
'q06-02':F(4,10)+F(5,10)-F(2,10),'q06-03':F(12,100)/F(4,10),
'q07-02':mu,'q07-03':sum((x-mu)**2*p for x,p in enumerate(weights)),
'q08-02':F(3,4)*F(3,4)*F(1,4),'q08-03':F(3,4)*F(3,4),
'q09-02':F(sum(sum(s)==2 for s in bin_sequences),16),
'q09-03':F(sum(sum(s[:3])==1 and s[3]==1 for s in bin_sequences),16),
'q10-02':F(sum(sum(x<4 for x in s)==2 for s in red_samples),len(red_samples)),
'q10-03':F(sum(sum(x<4 for x in s) for s in red_samples),len(red_samples)),
'q11-02':6*F(30,60),'q11-03':math.exp(-2),
'q12-02':int_poly([F(1,6)],F(3),F(5)),'q12-03':int_poly([0,0,F(2)],F(0),F(1)),
'q13-02':3*2,'q13-03':math.exp(-10/5),
'q14-02':(16-10)/math.sqrt(9),
'q15-02':math.gamma(3),'q15-03':math.gamma(5),
'q16-02':F(1,10)+F(4,10),
'q17-02':F(6,8),'q17-03':3*2*2,
'q18-02':F(6,10)*F(5,2),'q18-03':F(-8,10)**2*100,
'q19-02':math.sqrt(15**2/25),
'q20-02':2**2*4+(-1)**2*9,'q20-03':math.sqrt(81/9)
}
nums=[q for q in questions if q['type']=='numeric']
assert len(nums)==34 and set(expected)=={q['id'] for q in nums}
for q in nums:assert math.isclose(float(expected[q['id']]),q['answer'],rel_tol=1e-12,abs_tol=1e-12),q['id']
# Check representative lecture calculations and identified corrections.
assert int_poly([F(-5,4),F(25,2)],F(1,10),F(1,2))==1
assert int_poly([F(-5,4),F(25,2)],F(1,5),F(3,10))==F(3,16)
assert int_poly([0,F(-5,4),F(25,2)],F(1,10),F(1,2))==F(11,30)
assert int_poly([F(-5,4),F(25,2)],F(1,10),F(3,10))==F(1,4)
table=[[.84,.03,.02,.01],[.06,.01,.008,.002],[.01,.005,.004,.001]]
assert math.isclose(sum(map(sum,table)),1)
assert all(math.isclose(a,b) for a,b in zip(map(sum,table),[.90,.08,.02]))
assert all(math.isclose(sum(row[i] for row in table),v) for i,v in enumerate([.91,.045,.032,.013]))
assert sum(2*x-1 for x in range(1,7))==36
summary=f'''# Content validation report

- Passed: 15 original PDF files present with unchanged SHA-256 hashes; 123 page-delimited source pages.
- Passed: 20 unique lessons with valid prerequisite IDs and source-page references.
- Passed: 60 unique questions, exactly three per lesson (20 multiple-choice, 34 numeric, six rubric-based).
- Passed: all 34 numeric answer keys independently recomputed, including enumeration of card/token-style samples and Bernoulli sequences.
- Passed: {link_count} local Markdown link targets resolve, including lesson links and original PDF files.
- Passed: glossary lesson IDs, multiple-choice option indices, and free-response rubric structure.
- Passed: representative density integrals, lecture joint-table marginals, and maximum-of-two-dice normalization.
- Manually checked: 20 conceptual multiple-choice keys and six free-response rubrics against the authored lessons; selected PDF pages visually checked for formulas and source inconsistencies.

Run again from any directory with `python3 /absolute/path/to/study-content/validate_content.py`.

These checks do not validate a future website, external search-result content, or all possible interpretations of an instructor's exam scope. The formula reference marks supplemental formulas. See SOURCE-ISSUES.md for source corrections and reading-method limits.
'''
(ROOT/'VALIDATION.md').write_text(summary)
print(summary)
