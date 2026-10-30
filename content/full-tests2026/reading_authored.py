import re,collections
from completions_authored import ADAPTED,ORIGINAL_COMPLETIONS
from readings_authored import SINGLES,MULTIPLES

# Context-appropriate lexical tasks for source multi-document groups with four existing items.
# No item is duplicated to reach the five-question group size.
LEX=r'''
available|obtainable|mandatory|damaged|costly|có sẵn để dùng/nhận
required|necessary|optional|accidental|unrelated|cần thiết hoặc bắt buộc
additional|extra|previous|missing|temporary|thêm vào ngoài phần đã có
temporary|short-term|permanent|expensive|unavailable|chỉ có trong thời gian giới hạn
confirm|verify|cancel|delay|replace|xác nhận lại thông tin
revised|updated|rejected|hidden|copied|được sửa/cập nhật
eligible|qualified|excluded|delayed|uncertain|đủ điều kiện
estimated|approximate|guaranteed|unrelated|final|ước tính, chưa phải cam kết chắc chắn
included|listed|omitted|rejected|borrowed|được đưa vào danh sách trong ngữ cảnh giới thiệu trên website
requests|asks for|gives away|refuses|forgets|yêu cầu hoặc đề nghị nhận điều gì
provide|supply|remove|damage|ignore|cung cấp
replace|substitute for|pay for|look at|ask about|thay thế
approved|authorized|forbidden|unfinished|unexpected|được chấp thuận
deadline|final date|first payment|main entrance|extra cost|hạn cuối
prior|earlier|later|cheaper|safer|có trước
restricted|limited|expanded|promoted|repaired|bị giới hạn
adjacent|nearby|expensive|unusual|uppermost|ở gần/kề nhau
adjusted|modified|ignored|delivered|prohibited|được điều chỉnh
delayed|postponed|completed|included|displayed|bị chậm hoặc dời lại
convenient|practical|dangerous|compulsory|unrelated|thuận tiện/phù hợp cho việc dùng
retain|keep|discard|publish|borrow|giữ lại
notify|inform|charge|replace|inspect|thông báo cho ai
issue|problem|benefit|permission|payment|vấn đề cần xử lý
scheduled|planned|completed|damaged|refunded|đã được lên lịch
inspection|examination|advertisement|payment|invitation|việc kiểm tra
renew|extend|cancel|remove|hide|gia hạn
in advance|beforehand|afterward|by mistake|at once|trước thời điểm diễn ra
separately|individually|together|silently|randomly|một cách riêng/tách biệt
purchase|buy|borrow|return|repair|mua
mandatory|compulsory|optional|temporary|uncertain|bắt buộc
responsible|in charge|on leave|out of stock|under repair|chịu trách nhiệm/phụ trách
reduce|decrease|increase|confirm|collect|giảm
remain|stay|depart|fail|expand|vẫn ở/giữ nguyên trạng thái
improve|enhance|worsen|remove|delay|cải thiện
alternative|another option|final approval|main problem|fixed charge|lựa chọn khác có thể dùng
permitted|allowed|required|delayed|repaired|được cho phép
conditions|requirements|decorations|payments|employees|các điều kiện cần đáp ứng
brief|short|complete|expensive|private|ngắn gọn
accurately|correctly|quickly|quietly|cheaply|một cách chính xác
exclude|leave out|add in|pay back|look up|loại khỏi phạm vi
receive|get|send|lose|refuse|nhận
participate|take part|move away|pay extra|give up|tham gia
valid|acceptable|expired|incomplete|damaged|còn giá trị/có thể chấp nhận
select|choose|replace|cancel|compare|chọn
locate|find|design|ship|close|tìm vị trí của thứ gì
appropriate|suitable|identical|unnecessary|distant|phù hợp với mục đích
request|ask for|turn down|pay back|take away|yêu cầu
proceed|continue|cancel|refund|inspect|tiếp tục thực hiện
ensure|make sure|find out|give up|pay back|bảo đảm
annual|yearly|weekly|monthly|daily|hằng năm
reimbursement|repayment|reservation|measurement|replacement|hoàn lại chi phí hợp lệ
attached|enclosed|delayed|expired|missing|được đính kèm
maximum|upper limit|minimum fee|average result|previous date|giới hạn trên
minimum|lower limit|full refund|latest date|extra benefit|giới hạn dưới
disruption|interruption|improvement|agreement|reimbursement|sự gián đoạn
authorize|permit|prohibit|postpone|inspect|cho phép theo thẩm quyền
completed|finished|started|required|revised|đã hoàn thành
assigned|allocated|canceled|borrowed|ignored|được phân công/phân bổ
existing|current|future|missing|optional|hiện có
specific|particular|general|temporary|distant|cụ thể
maintain|keep|remove|replace|borrow|duy trì
cancel|call off|carry out|look up|send back|hủy
review|examine|purchase|deliver|discard|xem xét/kiểm tra
respond|reply|depart|borrow|combine|phản hồi
availability|ability to be obtained|legal ownership|total expense|physical damage|tình trạng có thể mua/nhận được hàng
'''
LEXICON=[line.split('|') for line in LEX.strip().splitlines()]
LEXICON=[entry for entry in LEXICON if entry[0] not in {'issue','requests','purchase','review','request','responsible'}]
LEXICON += [
 ['operate','run','delay','purchase','cancel','vận hành'],
 ['employees','staff members','customers','suppliers','visitors','nhân viên'],
 ['participants','attendees','organizers','products','locations','người tham gia'],
 ['employers','hiring organizations','job applicants','retired workers','service users','đơn vị sử dụng lao động'],
 ['weekday','Monday-to-Friday','public holiday','weekend','evening','các ngày từ thứ Hai đến thứ Sáu'],
 ['encouraged','urged','forbidden','refunded','replaced','được khuyến khích'],
 ['automatically','without a separate action','only by hand','after approval in person','by chance','tự động không cần thao tác riêng'],
 ['within','inside the stated limit','beyond','before all events','regardless of','trong giới hạn đã nêu'],
 ['approximately','roughly','exactly','rarely','permanently','xấp xỉ'],
 ['promptly','without delay','occasionally','secretly','carelessly','kịp thời, không trì hoãn'],
 ['instead','as an alternative','at the same time','in advance','by accident','thay vào đó'],
 ['limited','restricted','unlimited','required','completed','có giới hạn'],
 ['slightly','a little','completely','frequently','intentionally','hơi, một chút'],
 ['permanently','on a lasting basis','for a short time','occasionally','incorrectly','một cách lâu dài'],
 ['nearby','close by','far away','upstairs','outside the region','ở gần'],
 ['original','initial','revised','additional','unrelated','ban đầu'],
 ['immediately','at once','much later','by chance','in private','ngay lập tức'],
 ['regular','usual','exceptional','damaged','borrowed','thường lệ'],
 ['canceled','called off','completed','advertised','renewed','đã hủy'],
 ['significant','substantial','tiny','accidental','temporary','đáng kể'],
 ['reduce','decrease','increase','confirm','collect','giảm'],
 ['remains','stays','departs','fails','expands','vẫn giữ trạng thái'],
 ['processes','procedures','locations','discounts','suppliers','các quy trình'],
 ['regularly','routinely','rarely','accidentally','privately','một cách thường xuyên'],
 ['defects','faults','benefits','instructions','receipts','các lỗi/hư hỏng'],
 ['unauthorized','not approved','required','recently completed','fully insured','không được chấp thuận'],
 ['pending','not yet decided','already canceled','fully paid','permanently removed','đang chờ xử lý/quyết định'],
 ['broader','more wide-ranging','more expensive','more private','more delayed','có phạm vi rộng hơn'],
 ['proposed','suggested','rejected','completed','purchased','đã đề xuất'],
 ['decline','decrease','increase','replacement','agreement','sự sụt giảm'],
]
HEADERS={
 'P7-R35':['TEXT MESSAGE','DELIVERY NOTE'],'P7-R36':['E-MAIL'],'P7-R38':['REPLY'],'P7-R39':['E-MAIL'],
 'P7-R40':['SCHEDULE','E-MAIL'],'P7-R41':['E-MAIL'],'P7-R42':['TEXT MESSAGE'],'P7-R43':['E-MAIL','TEXT MESSAGE'],
 'P7-R44':['CHAT MESSAGE'],'P7-R46':['PROJECT UPDATE','CHAT MESSAGE'],'P7-R47':['E-MAIL'],'P7-R48':['FAQ EXCERPT','CHAT MESSAGE'],
 'P7-R51':['E-mail'],'P7-R52':['E-mail 2','Catalog Production Note'],'P7-R59':['Customer Message'],
 'P7-R60':['E-mail'],'P7-R61':['Online Chat'],'P7-R62':['Text Message'],'P7-R63':['E-mail'],
 'P7-R64':['Resident Comment'],'P7-R65':['Memo'],'P7-R66':['E-mail','Form Instructions'],
 'P7-R67':['Customer Review','Return Policy'],'P7-R68':['Survey Result','Manager Message'],
 'P7-R69':['FAQ','Customer E-mail'],'P7-R70':['Volunteer Sign-up Note','E-mail'],'P7-R73':['E-MAIL']}
def clean(value):
 value=value.replace('\\n','\n')
 value=re.sub(r'(?<=[^\W\d_]{2})(?=\d)|(?<=\d)(?=[^\W\d_])',' ',value)
 value=re.sub(r'(?<=\.)(?=[a-z]{2,})',' ',value)
 value=re.sub(r'(?<=[.!?])(?=[A-Z][a-z])',' ',value)
 return value
def documents(gid,body,multiple):
 if not multiple:return [('notice',clean(body))]
 if re.match(r'DOCUMENT 1\b',body):parts=re.split(r'\n\n(?=DOCUMENT [23]\b)',body)
 else:
  cursor=0;indices=[]
  for heading in HEADERS[gid]:
   match=re.search(r'\n\n'+re.escape(heading)+r'\n',body[cursor:])
   if not match:raise ValueError(('Missing document boundary',gid,heading))
   pos=cursor+match.start()+2;indices.append(pos);cursor=pos+len(heading)
  starts=[0,*indices,len(body)];parts=[body[starts[i]:starts[i+1]].strip() for i in range(len(starts)-1)]
 if not 2<=len(parts)<=3:raise ValueError(('Wrong passage count',gid,len(parts)))
 return [('chat' if any(w in p.split('\n')[0].lower() for w in ['chat','message chain','text message']) else 'email' if 'mail' in p.split('\n')[0].lower() else 'notice',clean(p)) for p in parts]

def build_reading(grouped,pools,unit,question,add,licensed,source_why,skill_of):
 # First build source reading sets. Sentence/word tasks retain their actual blank position.
 good={'P6-G28','P6-G32','P6-G33','P6-G34','P6-G35','P6-G36','P6-G37','P6-G38'}
 for gid in sorted(good):
  rows=grouped[(6,gid)];body=rows[0]['passage']
  body=re.sub(r'_+\s*\((\d)\)',lambda m:'{{'+m[1]+'}}',body)
  body=re.sub(r'\((\d)\)\s*_+',lambda m:'{{'+m[1]+'}}',body)
  if len(re.findall(r'\{\{\d\}\}',body))!=4:raise ValueError(('Invalid source blanks',gid))
  u=unit(6,f'Question Ocean · {gid}',docs=[('notice',clean(body))],provenance=licensed(gid))
  for i,raw in enumerate(rows,1):
   choices=raw['choices'];answer=choices[raw['answer']];sentence='sentence' in raw['prompt'].lower()
   skill='text-cohesion' if sentence else 'word-form'
   question(u,f'Choose the best completion for blank {i} in {gid}.',[answer]+[c for j,c in enumerate(choices) if j!=raw['answer']],source_why(raw,skill,body),skill,'advanced' if sentence else 'intermediate',blank=i,blank_type='sentence' if sentence else 'word')
  add(u)
 for line in ADAPTED.strip().splitlines():
  gid,title,body,sentence_options,why=line.split('|');rows=grouped[(6,gid)];u=unit(6,title,docs=[('notice',clean(body))],provenance=licensed(gid))
  if sentence_options=='SOURCE':
   for i,raw in enumerate(rows,1):
    opts=raw['choices'];answer=opts[raw['answer']];sentence='sentence' in raw['prompt'].lower() or len(answer.split())>=7
    question(u,f'Choose the best completion for blank {i} in {title}.',[answer]+[v for j,v in enumerate(opts) if j!=raw['answer']],why,'text-cohesion' if sentence else 'word-form',blank=i,blank_type='sentence' if sentence else 'word')
  else:
   for i,raw in enumerate(rows[:3],1):
    opts=raw['choices'];answer=opts[raw['answer']]
    question(u,f'Choose the best completion for blank {i} in {title}.',[answer]+[v for j,v in enumerate(opts) if j!=raw['answer']],why,'word-form',blank=i)
   question(u,f'Choose the best sentence for blank 4 in {title}.',sentence_options.split('~'),why,'text-cohesion','advanced',blank=4)
  add(u)
 for title,body,words,sentences,why in ORIGINAL_COMPLETIONS:
  u=unit(6,title,docs=[('email',clean(body))])
  for i,opts in enumerate(words,1):question(u,f'Choose the best completion for blank {i} in {title}.',opts,why,'word-form',blank=i)
  question(u,f'Choose the best sentence for blank 4 in {title}.',sentences,why,'text-cohesion','advanced',blank=4);add(u)

 multis=[];singles=[]
 for (part,gid),rows in grouped.items():
  if part!=7:continue
  raw=rows[0];multi=any(t in ['double-passage','triple-passage'] for t in raw.get('tags',[]))
  docs=documents(gid,raw['passage'],multi)
  u=unit(7,f'Question Ocean · {gid}',docs=docs,provenance=licensed(gid),source_id=gid)
  for r in rows:
   opts=r['choices'];answer=opts[r['answer']];skill=skill_of(r,7)
   if multi and skill=='reading-detail' and any(w in r['prompt'].lower() for w in ['both','based on','which train','total','how much','according to the documents']):skill='cross-text'
   question(u,r['prompt'],[answer]+[v for j,v in enumerate(opts) if j!=r['answer']],source_why(r,skill,raw['passage']),skill,'advanced' if skill in ['cross-text','reading-inference'] else 'intermediate')
  (multis if multi else singles).append(u)
 # Each of the 34 four-question multiple passages receives a different contextual vocabulary task.
 pending=[u for u in multis if len(u['questions'])==4]
 matches={u['key']:[entry for entry in LEXICON if re.search(r'\b'+re.escape(entry[0])+r'\b',' '.join(d[1] for d in u['docs']),re.I)] for u in pending}
 assignment={}
 def place(u,seen):
  for entry in matches[u['key']]:
   word=entry[0]
   if word in seen:continue
   seen.add(word)
   if word not in assignment or place(assignment[word],seen):assignment[word]=u;return True
  return False
 for u in sorted(pending,key=lambda u:len(matches[u['key']])):
  if not place(u,set()):raise ValueError(('No unique lexical task',u['title']))
 entries={e[0]:e for e in LEXICON}
 for word,u in assignment.items():
  entry=entries[word];doc=next(i for i,d in enumerate(u['docs'],1) if re.search(r'\b'+re.escape(word)+r'\b',d[1],re.I))
  question(u,f'In Document {doc}, the expression “{word}” is closest in meaning to',entry[1:5],f'Trong ngữ cảnh này, «{word}» có nghĩa {entry[5]}. Phương án tương đương là «{entry[1]}»; các phương án còn lại chuyển sang nghĩa khác.','reading-detail')
 # 63 source single passages + 27 originals. Trim one four-item set to a three-item set.
 trim=next(u for u in singles if len(u['questions'])==4);trim['questions'].pop()
 for title,body,purpose,detail,action,why in SINGLES:
  u=unit(7,title,docs=[('email' if body.startswith('To:') else 'notice',clean(body))])
  question(u,'What is the main purpose of this text?',purpose.split('~'),why,'reading-detail')
  question(u,'What is indicated in the text?',detail.split('~'),why,'reading-detail')
  question(u,'What should a reader do according to the text?',action.split('~'),why,'reading-inference','advanced');singles.append(u)
 for title,docs,items in MULTIPLES:
  u=unit(7,title,docs=[(f,clean(b)) for f,b in docs])
  for prompt,opts,why,skill in items:question(u,clean(prompt),opts,why,skill,'advanced')
  multis.append(u)
 for u in [*singles,*multis]:add(u)
