"""Compile authored situations and attributed MIT adaptations into nine disjoint practice forms.
No learner database writes. Counts, keys and table constraints are deterministic authoring checks.
Publication fingerprints and canonical schema/media checks are performed by the existing TS importer.
"""
import json,re,hashlib,random,collections
from pathlib import Path
from listening_authored import CONVERSATIONS
from situations_authored import CONVERSATION_CASES
from talks_authored import TALK_CASES
from graphics_authored import GRAPHICS,ALTERNATIVES
from responses_authored import RESPONSES
from photos_authored import PHOTOS

ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
REV='fulltests2026-r2'
ORDER_SEED='fulltests2026-r1' # Preserve form assignments and question IDs across corrections.
COMMIT='a940bb8b479ef4d06af468015d757041c3d2e457'
SOURCE=ROOT/'content/sources/toeic-question-ocean'/COMMIT
RAW=json.loads((SOURCE/'candidates.json').read_text(encoding='utf-8'))['items']
REFS=json.loads((ROOT/'content/reference-index.json').read_text(encoding='utf-8'))
POOLS={part:[] for part in range(1,8)}
VI={}
SEQ=collections.Counter()
ORIGINAL={'kind':'original','author':'STUDY 990 / Codex','revision':REV,'editorialStatus':'ai-draft',
 'note':'AI-authored practice. Not independently human-reviewed, not ETS material, and not empirically score-calibrated.'}
def licensed(source_id):
 return {'kind':'licensed','author':'Chun-Hsiung Luo; STUDY 990 / Codex adaptation','revision':REV,
 'note':f'MIT original simulation source {source_id}; AI adaptation and Vietnamese guidance, not independently human-reviewed or calibrated against ETS.',
 'provider':'TOEIC Question Ocean','sourceUrl':f'https://github.com/kdeppaei/toeic-question-ocean/tree/{COMMIT}',
 'attribution':'Copyright (c) 2026 Chun-Hsiung Luo. Adapted under the MIT License. See /licenses/toeic-question-ocean-MIT.txt.',
 'license':'MIT','licenseUrl':f'https://raw.githubusercontent.com/kdeppaei/toeic-question-ocean/{COMMIT}/LICENSE'}
GRAM={'word-form':'word-forms','agreement':'agreement','tenses':'tenses','passive':'passive','verb-patterns':'verb-patterns',
 'connectors':'connectors','conditionals':'conditionals','relative-clauses':'relatives','subjunctive':'subjunctive',
 'prepositions':'prepositions','comparisons':'comparisons','modals':'modals','inversion':'inversion'}
RULES={
 'word-form':'Xác định từ đang được bổ nghĩa và vị trí danh từ, tính từ, trạng từ hoặc động từ trong câu.',
 'agreement':'Tìm chủ ngữ trung tâm và chia động từ theo số, không theo danh từ ở gần nhất.',
 'tenses':'Dùng mốc thời gian và thứ tự các sự kiện để chọn thì; giữ đúng thể chủ động hoặc bị động.',
 'passive':'Phân biệt bên thực hiện và bên nhận hành động; bị động cần dạng be và phân từ quá khứ.',
 'verb-patterns':'Kiểm tra mẫu kết hợp của động từ hoặc giới từ đứng trước vị trí trống.',
 'connectors':'Xét cả cấu trúc theo sau và quan hệ nguyên nhân, tương phản, điều kiện hoặc kết quả.',
 'conditionals':'Đối chiếu điều kiện với hệ quả, thời gian và mức độ giả định của cả câu.',
 'relative-clauses':'Xác định tiền ngữ và thành phần còn thiếu trong mệnh đề quan hệ.',
 'subjunctive':'Với yêu cầu/đề nghị bắt buộc, kiểm tra động từ nguyên mẫu trong mệnh đề that.',
 'prepositions':'Chọn giới từ theo quan hệ nghĩa và cụm kết hợp, không dịch từng từ riêng lẻ.',
 'comparisons':'Xác định hai đối tượng hoặc phạm vi so sánh rồi chọn đúng dạng so sánh.',
 'modals':'Kiểm tra nghĩa khả năng, nghĩa vụ hoặc suy đoán; sau động từ khuyết thiếu dùng dạng phù hợp.',
 'inversion':'Khôi phục trật tự bình thường; chỉ đảo trợ động từ hoặc be khi cấu trúc yêu cầu.',
 'listening-intent':'Đáp đúng chức năng giao tiếp; lời đề nghị hoặc phản hồi gián tiếp không nhất thiết lặp từ khóa.',
 'listening-detail':'Theo đúng người, hành động, điều kiện và thời điểm trong audio; không ghép nhầm các chi tiết.',
 'listening-main-idea':'Xác định mục đích chính của toàn bài, không chọn một chi tiết phụ làm ý chính.',
 'listening-inference':'Suy luận vừa đủ từ lời nói; phân biệt điều đã xác nhận với kế hoạch hoặc giả định.',
 'visual-integration':'Kết hợp các điều kiện nghe được với bảng; một hàng phải thỏa đồng thời mọi điều kiện.',
 'reading-detail':'Đối chiếu phương án với dữ kiện và phạm vi áp dụng trong văn bản.',
 'reading-inference':'Chỉ suy ra điều văn bản hỗ trợ; không biến khả năng hoặc ước tính thành sự chắc chắn.',
 'cross-text':'Ghép dữ kiện giữa các tài liệu và kiểm tra điều kiện, thời điểm hoặc đối tượng có trùng nhau không.',
 'text-cohesion':'Xét mạch ý, từ nối và tham chiếu giữa các câu, không chỉ xét một chỗ trống riêng.',
 'photo-detail':'Chọn chi tiết nhìn thấy; không suy diễn hành động hoặc vật thể ngoài khung hình.'}

def skill_of(raw,part):
 tags=' '.join(raw.get('tags',[])).lower(); cat=raw.get('category','');prompt=raw.get('prompt','').lower()
 if part==2:return 'listening-intent'
 if part in [3,4]:
  return 'listening-inference' if any(s in prompt for s in ['imply','mean when','probably']) else 'listening-main-idea' if any(s in prompt for s in ['mainly','purpose','most likely work','most likely speaking']) else 'listening-detail'
 if part in [6,7]:return 'cross-text' if 'cross' in tags else 'reading-inference' if any(s in prompt for s in ['imply','suggest','inferred','most likely']) else 'reading-detail'
 for pattern,skill in [('inversion','inversion'),('倒裝','inversion'),('subjunct','subjunctive'),('假設語氣','subjunctive'),('passive','passive'),('被動','passive'),('agreement','agreement'),('一致','agreement'),('relative','relative-clauses'),('關係','relative-clauses'),('tense','tenses'),('時態','tenses'),('完成式','tenses'),('comparison','comparisons'),('比較','comparisons'),('最高級','comparisons'),('介系詞','prepositions'),('preposition','prepositions'),('gerund','verb-patterns'),('infinitive','verb-patterns'),('不定詞','verb-patterns'),('動名詞','verb-patterns'),('pattern','verb-patterns'),('連接','connectors'),('conjunction','connectors'),('讓步','connectors'),('condition','conditionals'),('條件','conditionals')]:
  if pattern in tags+' '+cat:return skill
 return 'word-form'

def unit(part,title,audio=None,docs=None,photo=None,exhibit=None,provenance=None,source_id=None):
 SEQ[part]+=1
 key=f'p{part}-g{SEQ[part]:03}'
 return dict(key=key,part=part,title=title,audio=audio,docs=docs,photo=photo,exhibit=exhibit,
  provenance=provenance or ORIGINAL,source_id=source_id,questions=[])

def question(u,prompt,choices,why,skill=None,difficulty='intermediate',blank=None,evidence=None,blank_type=None):
 choices=choices.split('|') if isinstance(choices,str) else list(choices)
 if len(set(choices))!=len(choices) or len(choices)!=(3 if u['part']==2 else 4):raise ValueError((u['title'],choices))
 skill=skill or {1:'photo-detail',2:'listening-intent',3:'listening-detail',4:'listening-detail',5:'word-form',6:'text-cohesion',7:'reading-detail'}[u['part']]
 why=why.strip()
 if not why:raise ValueError('Missing explanation')
 u['questions'].append(dict(prompt=prompt,choices=choices,why=why,skill=skill,difficulty=difficulty,blank=blank,evidence=evidence,blank_type=blank_type))

def add(u):POOLS[u['part']].append(u)
def excerpt(body,correct):
 segments=[s.strip() for s in re.split(r'(?<=[.!?])\s+|\n',body) if s.strip()]
 words=set(re.findall(r'[a-z]{3,}',correct.lower()))-{'the','and','that','with','from','will','have','they','their'}
 return max(segments,key=lambda s:len(words&set(re.findall(r'[a-z]{3,}',s.lower()))),default=body[:180])[:360]
def source_why(raw,skill,body=''):
 correct=raw['choices'][raw['answer']]
 evidence=raw.get('evidence') or excerpt(body,correct)
 if raw.get('part')=='5':
  completed=re.sub(r'[-_]{3,}',correct,raw['prompt'])
  return f'{RULES[skill]} Câu hoàn chỉnh: «{completed}». Phương án phù hợp là «{correct}».'
 return f'{RULES[skill]} Phương án phù hợp: «{correct}». Dữ kiện để đối chiếu: «{evidence}».'

def load_source():
 grouped=collections.defaultdict(list)
 for candidate in RAW:
  raw=candidate['raw'];part=candidate['part']
  if part in [3,4,6,7]:grouped[(part,raw['groupId'])].append(raw)
  elif part in [2,5]:
   # Inversion remains in the bank, but does not dominate the full-form grammar distribution.
   skill=skill_of(raw,part)
   u=unit(part,f'Question Ocean · {raw["id"]}',audio=raw.get('audioText') if part==2 else None,provenance=licensed(raw['id']),source_id=raw['id'])
   choices=raw['choices'];correct=choices[raw['answer']];choices=[correct]+[c for i,c in enumerate(choices) if i!=raw['answer']]
   question(u,raw.get('prompt') or 'Choose the best response.',choices,source_why(raw,skill,raw.get('audioText','')),skill,
    {'400':'foundation','600':'intermediate','800':'advanced'}.get(raw.get('difficulty'),'advanced'))
   add(u)
 for (part,gid),rows in grouped.items():
  if part not in [3,4]:continue
  if part==3 and gid=='P3-G18':continue # Same audio as upstream P3-052; retain only one source set.
  body=rows[0]['audioText'].replace('\\n','\n')
  u=unit(part,f'Question Ocean · {gid}',audio=body,provenance=licensed(gid),source_id=gid)
  for raw in rows:
   choices=raw['choices'];correct=choices[raw['answer']];skill=skill_of(raw,part)
   question(u,raw['prompt'],[correct]+[c for i,c in enumerate(choices) if i!=raw['answer']],source_why(raw,skill,body),skill,
    'advanced' if skill=='listening-inference' else 'intermediate')
  add(u)
 return grouped

def load_authored():
 photos=json.loads((HERE/'photo-assets.json').read_text(encoding='utf-8'))
 for i,(choices,why) in enumerate(PHOTOS):
  p=photos[i];u=unit(1,f'Photograph {i+1:02}',audio='Look at the photograph.',photo=p)
  question(u,'Which statement best describes the photograph?',choices,why,'photo-detail');add(u)
 for row in RESPONSES[:116]:
  prompt,correct,d1,d2,why=row
  u=unit(2,prompt,audio=prompt);question(u,'Choose the best response.',[correct,d1,d2],why,'listening-intent');add(u)
 for title,body,items in CONVERSATIONS:
  u=unit(3,title,audio=body)
  for prompt,choices,why in items:question(u,prompt,choices,why,skill_of({'prompt':prompt},3))
  add(u)
 for n,(title,a,b,c,purpose,detail,action,why) in enumerate(CONVERSATION_CASES):
  triple=n<18
  body=f'Nina: Omar, {a}\nOmar: Leah, {b}\nLeah: Thanks, Nina. {c}' if triple else f'W: {a}\nM: {b}\nW: {c}'
  u=unit(3,title,audio=body)
  question(u,'What are the speakers mainly discussing?',purpose.split('~'),why,'listening-main-idea')
  question(u,f'What does {"Omar" if triple else "the man"} indicate?',detail.split('~'),why,'listening-detail')
  question(u,f'What will {"Leah" if triple else "the woman"} most likely do?',action.split('~'),why,'listening-inference','advanced');add(u)
 for title,body,purpose,detail,action,why in TALK_CASES[:55]:
  u=unit(4,title,audio=body)
  question(u,'What is the main purpose of the talk?',purpose.split('~'),why,'listening-main-idea')
  question(u,'What does the speaker indicate?',detail.split('~'),why,'listening-detail')
  question(u,'What are listeners advised to do?',action.split('~'),why,'listening-inference','advanced');add(u)
 graphic_alternatives=[line.split('|') for line in ALTERNATIVES.strip().splitlines()]
 if len(graphic_alternatives)!=len(GRAPHICS):raise ValueError('Missing exhibit distractors')
 for gi,g in enumerate(GRAPHICS):
  def value(x):
   if re.fullmatch(r'\d{1,2}:\d{2}',x):h,m=x.split(':');return int(h)*60+int(m)
   try:return float(x.replace('$',''))
   except ValueError:return x
  def matches(row):
   for index,op,wanted in g['rules']:
    actual,wanted=value(row[index]),value(wanted)
    if not {'=':lambda:actual==wanted,'<':lambda:actual<wanted,'<=':lambda:actual<=wanted,'>=':lambda:actual>=wanted}[op]():return False
   return True
  possible=[row for row in g['rows'] if matches(row)]
  if len(possible)!=1:raise ValueError(('Ambiguous exhibit',g['title']))
  correct=possible[0][0];part=3 if g['kind']=='c' else 4
  body=(f'W: {g["intro"]}\nM: {g["need"]} {g["reason"]}\nW: I will check both requirements against the table before confirming the choice.' if part==3 else f'{g["intro"]} {g["need"]} {g["reason"]}')
  exhibit=dict(kind='table',title=f'{g["columns"][0]} options',columns=g['columns'],rows=g['rows'])
  u=unit(part,g['title'],audio=body,exhibit=exhibit)
  question(u,'What is the discussion mainly about?' if part==3 else 'What is the purpose of the announcement?',
   [g['title']]+graphic_alternatives[gi][0].split('~'),g['vi'],'listening-main-idea')
  question(u,'What reason is given for the requirements?',
   [g['reason']]+graphic_alternatives[gi][1].split('~'),g['vi'],'listening-detail')
  question(u,'Look at the graphic. Which option satisfies the stated requirements?',
   [correct]+[row[0] for row in g['rows'] if row[0]!=correct],g['vi'],'visual-integration','advanced');add(u)
  reasons={}
  for row in g['rows']:
   failed=[]
   for index,op,wanted in g['rules']:
    actual,expected=value(row[index]),value(wanted)
    ok={'=':lambda:actual==expected,'<':lambda:actual<expected,'<=':lambda:actual<=expected,'>=':lambda:actual>=expected}[op]()
    if not ok:failed.append(f'{g["columns"][index]}: {row[index]} (cần {op} {wanted})')
   reasons[row[0]]=f'{row[0]} không đạt: '+ '; '.join(failed)+'.' if failed else f'{row[0]} thỏa đồng thời cả hai điều kiện. {g["vi"]}'
  u['questions'][-1]['option_reasons']=reasons

def compile_forms():
 # Imported lazily after the authored data files are present.
 from reading_authored import build_reading,clean
 grouped=load_source();load_authored();build_reading(grouped,POOLS,unit,question,add,licensed,source_why,skill_of)
 for part,expected in [(1,54),(2,225),(3,117),(4,90),(5,270),(6,36),(7,135)]:
  if len(POOLS[part])<expected:raise ValueError(f'Part {part}: need {expected} groups, have {len(POOLS[part])}')
 # Select varied Part 5 items; excess source questions remain in the source archive, not inflated counts.
 p5=POOLS[5];regular=[u for u in p5 if u['questions'][0]['skill']!='inversion'];inversions=[u for u in p5 if u['questions'][0]['skill']=='inversion']
 POOLS[5]=(regular[:252]+inversions[:18])[:270]
 if len(POOLS[5])!=270:raise ValueError('Insufficient varied Part 5 items')
 for part in range(1,7):random.Random(f'{ORDER_SEED}:{part}').shuffle(POOLS[part])
 # Keep comparable task coverage between forms, rather than leaving graphics/three-speaker
 # conversations clustered in whichever form a plain shuffle happens to produce.
 for part in [3,4]:
  graphics=[u for u in POOLS[part] if u['exhibit']]
  triples=[u for u in POOLS[part] if not u['exhibit'] and (u['audio'] or '').startswith('Nina:')]
  ordinary=[u for u in POOLS[part] if u not in graphics and u not in triples]
  ordered=[]
  for i in range(9):
   graphic_count=(2 if i<8 else 1) if part==3 else 1
   selected=[graphics.pop() for _ in range(graphic_count)]
   if part==3:selected += [triples.pop(),triples.pop()]
   selected += [ordinary.pop() for _ in range((13 if part==3 else 10)-len(selected))]
   random.Random(f'{part}:{i}:order').shuffle(selected);ordered+=selected
  if graphics or triples or ordinary:raise ValueError('Unused listening groups')
  POOLS[part]=ordered
 single={n:[u for u in POOLS[7] if len(u['docs'])==1 and len(u['questions'])==n] for n in [2,3,4]}
 multi=[u for u in POOLS[7] if len(u['docs'])>1]
 if [len(single[n]) for n in [2,3,4]]!=[29,41,20] or len(multi)!=45:raise ValueError(('Reading layout', {n:len(v) for n,v in single.items()},len(multi)))
 for n in single:random.Random(f'singles:{n}').shuffle(single[n])
 random.Random('multiple').shuffle(multi)
 forms=[]
 for i in range(9):
  units=[]
  for part,size in [(1,6),(2,25),(3,13),(4,10),(5,30),(6,4)]:units+=POOLS[part][i*size:(i+1)*size]
  sizes=[2]*4+[3]*3+[4]*3 if i<2 else [2]*3+[3]*5+[4]*2
  units += [single[n].pop() for n in sizes]+multi[i*5:(i+1)*5]
  number=i+2;pid=f'fulltests2026-{number:02}';bank={'questions':[],'stimuli':[],'passages':[],
   'grammarIds':REFS['grammarIds'],'vocabularyIds':[v['id'] for v in REFS['vocabulary']]};media=[]
  for u in units:
   if u['audio']:u['audio']=clean(u['audio'])
   sid=f'{pid}:{u["key"]}';pids=[]
   if u['docs']:
    for j,(fmt,body) in enumerate(u['docs']):
     docid=f'{sid}-doc{j+1}';pids.append(docid);bank['passages'].append(dict(id=docid,title=f'{u["title"]} · Document {j+1}',format=fmt,text=body))
   if u['part']!=5:
    stimulus=dict(id=sid,title=u['title'],topic='office',part=u['part'],provenance=u['provenance'],
     kind={1:'photograph',2:'question-response',3:'conversation',4:'talk',6:'text-completion',7:'reading'}[u['part']])
    if u['audio']:stimulus['audio']=dict(kind='synthetic',transcript=u['audio'])
    if pids:stimulus['passageIds']=pids
    if u['exhibit']:stimulus['exhibit']=u['exhibit']
    if u['photo']:
     p=u['photo'];stimulus['photograph']={k:p[k] for k in ['src','author','sourceUrl','license','licenseUrl']}
     stimulus['photograph'].update(status='ready',alt=u['questions'][0]['choices'][0])
     media.append(dict(path=p['src'],**{k:p[k] for k in ['author','sourceUrl','license','licenseUrl','sha256']}))
    bank['stimuli'].append(stimulus)
   for j,q in enumerate(u['questions']):
    q['prompt']=clean(q['prompt']);q['why']=clean(q['why'])
    if q['skill']!='visual-integration':q['choices']=[clean(choice) for choice in q['choices']]
    qid=f'{sid}-q{j+1}';order=list(range(len(q['choices'])));random.Random(qid).shuffle(order)
    opts=[]
    for n,index in enumerate(order):
     choice=q['choices'][index]
     reasoning=q.get('option_reasons',{}).get(choice) or (q['why'] if index==0 else f'«{choice}» không phù hợp với đáp án và các điều kiện đã nêu. {q["why"]}')
     opts.append(dict(id='ABCD'[n],text=choice,reasoning=reasoning))
    context=q['prompt']+' '+q['choices'][0]+' '+(u['audio'] or '')+' '+' '.join(d[1] for d in u['docs'] or [])
    vocab=[v['id'] for v in REFS['vocabulary'] if any(re.search(r'(?<![a-z])'+re.escape(f.lower())+r'(?![a-z])',context.lower()) for f in [v['word'],*v['forms']])][:6]
    item=dict(schemaVersion=1,id=qid,part=u['part'],prompt=q['prompt'],options=opts,answer=next(o['id'] for o in opts if o['text']==q['choices'][0]),
     explanation=q['why'],takeaway=RULES[q['skill']],skills=[q['skill']],difficulty=q['difficulty'],grammarIds=[GRAM[q['skill']]] if q['skill'] in GRAM and GRAM[q['skill']] in REFS['grammarIds'] else [],
     vocabularyIds=vocab,provenance=u['provenance'],topic='grammar' if u['part']==5 else 'office')
    if u['part']!=5:item['stimulusId']=sid
    if q['blank']:item.update(blankKey=str(q['blank']),blankType=q['blank_type'] or ('sentence' if q['blank']==4 else 'word'))
    bank['questions'].append(item)
  if [sum(q['part']==p for q in bank['questions']) for p in range(1,8)]!=[6,25,39,30,30,16,54]:raise ValueError(('Bad form',number))
  pkg=dict(format='study990.content',formatVersion=4,id=pid,revision=REV,purpose='mock',bank=bank,media=media,
   review=dict(status='unreviewed',author='STUDY 990 / Codex',date='2026-10-29',note='AI-authored originals and MIT source adaptations. Unreviewed practice release explicitly requested by the owner; no human approval or ETS calibration claimed.'))
  (HERE/f'form-{number:02}.json').write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
  forms.append(dict(id=pid,title=f'STUDY 990 · Full Test {number:02}',revision=REV,questionIds=[q['id'] for q in bank['questions']],durationMinutes=120,
   editorialStatus='ai-draft',eligibility='unreviewed-practice',note='Đề luyện tự biên và chuyển soạn nguồn MIT; chưa thẩm định độc lập, chưa hiệu chuẩn độ khó/điểm với ETS. Audio dùng giọng tổng hợp của thiết bị; ảnh chụp CC0.'))
 (HERE/'mock-manifests.json').write_text(json.dumps(forms,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'newForms':len(forms),'newQuestions':sum(len(f['questionIds']) for f in forms),'distinctQuestionIds':len({q for f in forms for q in f['questionIds']}),'humanReviewed':False,'ETSCalibrated':False},indent=2))

if __name__=='__main__':compile_forms()
