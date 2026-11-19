import json, os, csv
from collections import Counter
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
L = ['en', 'ja', 'ko', 'ne']
def T(en, ja, ko, ne): return {'en': en, 'ja': ja, 'ko': ko, 'ne': ne}

# Unit 1 words: (English, Japanese, Korean, Nepali, kind)
# kind: n = noun with a/an, p = plural, m = no article, c = colour, name = Mom/Dad, x = expression
W = {
 'hello':    ('hello', 'こんにちは', '안녕하세요', 'नमस्ते', 'x'),
 'bye':      ('bye-bye', 'バイバイ', '안녕', 'टाटा', 'x'),
 'mom':      ('Mom', 'ママ', '엄마', 'आमा', 'name'),
 'dad':      ('Dad', 'パパ', '아빠', 'बुबा', 'name'),
 'baby':     ('baby', 'あかちゃん', '아기', 'बच्चा', 'n'),
 'hand':     ('hand', 'て', '손', 'हात', 'n'),
 'eyes':     ('eyes', 'め', '눈', 'आँखा', 'p'),
 'nose':     ('nose', 'はな', '코', 'नाक', 'n'),
 'dog':      ('dog', 'いぬ', '강아지', 'कुकुर', 'n'),
 'cat':      ('cat', 'ねこ', '고양이', 'बिरालो', 'n'),
 'cow':      ('cow', 'うし', '소', 'गाई', 'n'),
 'bird':     ('bird', 'とり', '새', 'चरा', 'n'),
 'fish':     ('fish', 'さかな', '물고기', 'माछा', 'n'),
 'butterfly':('butterfly', 'ちょうちょ', '나비', 'पुतली', 'n'),
 'elephant': ('elephant', 'ぞう', '코끼리', 'हात्ती', 'n'),
 'monkey':   ('monkey', 'さる', '원숭이', 'बाँदर', 'n'),
 'red':      ('red', 'あか', '빨강', 'रातो', 'c'),
 'blue':     ('blue', 'あお', '파랑', 'निलो', 'c'),
 'yellow':   ('yellow', 'きいろ', '노랑', 'पहेँलो', 'c'),
 'green':    ('green', 'みどり', '초록', 'हरियो', 'c'),
 'white':    ('white', 'しろ', '하양', 'सेतो', 'c'),
 'black':    ('black', 'くろ', '검정', 'कालो', 'c'),
 'thankyou': ('thank you', 'ありがとう', '고마워요', 'धन्यवाद', 'x'),
 'yes':      ('yes', 'はい', '네', 'हो', 'x'),
 'no':       ('no', 'いいえ', '아니요', 'होइन', 'x'),
 'apple':    ('apple', 'りんご', '사과', 'स्याउ', 'n'),
 'banana':   ('banana', 'バナナ', '바나나', 'केरा', 'n'),
 'milk':     ('milk', 'ぎゅうにゅう', '우유', 'दूध', 'm'),
 'water':    ('water', 'みず', '물', 'पानी', 'm'),
 'rice':     ('rice', 'ごはん', '밥', 'भात', 'm'),
 'egg':      ('egg', 'たまご', '달걀', 'अण्डा', 'n'),
 'please':   ('please', 'おねがい', '주세요', 'दिनुस् न', 'x'),
}

def an(w): return ('an ' if w[0] in 'aeiou' else 'a ') + w

def word_lines(key):
    en, ja, ko, ne, k = W[key]
    if k == 'x':
        return {'say': T(en[0].upper() + en[1:] + '!', ja + '！', ko + '!', ne + '!')}
    say = T(en[0].upper() + en[1:] + '.', ja + '。', ko + '.', ne + '।')
    if k == 'name':
        look, find, yes = f'Look! {en}!', f'Where is {en}?', f'Yes! {en}!'
    elif k == 'n':
        look, find, yes = f'Look! {an(en).capitalize()}!', f'Where is the {en}?', f'Yes! The {en}!'
    elif k == 'p':
        look, find, yes = f'Look! {en.capitalize()}!', f'Where are the {en}?', f'Yes! The {en}!'
    elif k == 'm':
        look, find, yes = f'Look! {en.capitalize()}!', f'Where is the {en}?', f'Yes! {en.capitalize()}!'
    else:
        look, find, yes = f'Look! {en.capitalize()}!', f'Where is {en}?', f'Yes! {en.capitalize()}!'
    ne_find = f'{ne} कहाँ छन्?' if k == 'p' else f'{ne} कहाँ छ?'
    return {
        'say': say,
        'look': T(look, f'みて！{ja}！', f'봐요! {ko}!', f'हेरौं त! {ne}!'),
        'find': T(find, f'{ja}は どこかな？', f'{ko} 어디 있어요?', ne_find),
        'yes': T(yes, f'そう！{ja}！', f'맞아요! {ko}!', f'हो! {ne}!'),
    }

# (lesson, lead teacher, words or lesson type, phrase key)
LESSONS = [
 (1, 'asha', ['hello', 'bye'], 'p01'), (2, 'leo', ['mom', 'dad'], 'p02'), (3, 'asha', ['baby', 'hand'], 'p03'),
 (4, 'leo', ['eyes', 'nose'], 'p04'), (5, 'asha', 'review', None), (6, 'leo', ['dog', 'cat'], 'p06'),
 (7, 'asha', ['cow', 'bird'], 'p07'), (8, 'leo', ['fish', 'butterfly'], 'p08'), (9, 'asha', ['elephant', 'monkey'], 'p09'),
 (10, 'leo', 'review+story:who_says_hello', None), (11, 'asha', ['red', 'blue'], 'p11'), (12, 'leo', ['yellow', 'green'], 'p12'),
 (13, 'asha', ['white', 'black'], 'p13'), (14, 'leo', ['thankyou', 'yes', 'no'], 'p14'), (15, 'asha', 'review', None),
 (16, 'leo', ['apple', 'banana'], 'p16'), (17, 'asha', ['milk', 'water'], 'p17'), (18, 'leo', ['rice', 'egg'], 'p18'),
 (19, 'asha', ['please'], 'p19'), (20, 'leo', 'celebration+story:beeps_big_day+unlock', None),
]
PHRASES = {
 'p01': T('Hello!', 'こんにちは！', '안녕하세요!', 'नमस्ते!'),
 'p02': T('This is Mom.', 'これは ママ。', '엄마예요.', 'यो आमा हो।'),
 'p03': T('Wave your hand!', 'てを ふって！', '손을 흔들어요!', 'हात हल्लाऊ!'),
 'p04': T('Touch your nose!', 'はなを さわって！', '코를 만져요!', 'नाक छोऊ!'),
 'p06': T('The dog says woof.', 'いぬは ワンワン。', '강아지는 멍멍.', 'कुकुर भन्छ भुक भुक।'),
 'p07': T('The cow says moo.', 'うしは モーモー。', '소는 음매.', 'गाई भन्छ म्बाँ।'),
 'p08': T('The fish swims.', 'さかなが およぐよ。', '물고기가 헤엄쳐요.', 'माछा पौडिन्छ।'),
 'p09': T('The monkey jumps.', 'さるが ジャンプ！', '원숭이가 점프해요!', 'बाँदर उफ्रिन्छ।'),
 'p11': T("It's red!", 'あかだ！', '빨강이에요!', 'रातो हो!'),
 'p12': T("It's yellow!", 'きいろだ！', '노랑이에요!', 'पहेँलो हो!'),
 'p13': T('A black cat!', 'くろい ねこ！', '검은 고양이!', 'कालो बिरालो!'),
 'p14': T('Thank you!', 'ありがとう！', '고마워요!', 'धन्यवाद!'),
 'p16': T('Yummy!', 'おいしい！', '맛있어요!', 'मीठो!'),
 'p17': T('I want water.', 'みずが ほしい。', '물 주세요.', 'मलाई पानी चाहियो।'),
 'p18': T('Rice, please.', 'ごはん ください。', '밥 주세요.', 'भात दिनुस् न।'),
}
PHRASE_BY_SPEAKER = {
 'p19': {'asha': T('My name is Asha.', 'わたしの なまえは アシャ です。', '내 이름은 아샤예요.', 'मेरो नाम आशा हो।'),
         'leo':  T('My name is Leo.', 'ぼくの なまえは レオ です。', '내 이름은 레오예요.', 'मेरो नाम लियो हो।')},
}

TEACH = {
 'hello_friend': T('Hello, friend!', 'こんにちは、おともだち！', '친구야, 안녕!', 'नमस्ते साथी!'),
 'good_morning': T('Good morning!', 'おはよう！', '좋은 아침이에요!', 'शुभ प्रभात!'),
 'good_afternoon': T("Good afternoon!", 'こんにちは！', '좋은 오후예요!', 'शुभ दिउँसो!'),
 'good_evening': T("Good evening!", 'こんばんは！', '좋은 저녁이에요!', 'शुभ साँझ!'),
 'welcome_back': T("Welcome back!", 'おかえり！', '다시 와서 반가워요!', 'फेरि स्वागत छ!'),
 'nice_to_see': T("Nice to see you!", 'あえて うれしいな！', '만나서 반가워요!', 'भेटेर खुसी लाग्यो!'),
 'hi_there': T("Hi there!", 'やあ！', '안녕!', 'ए, नमस्ते!'),
 'fun_today': T("Let's have fun today!", 'きょうも たのしもうね！', '오늘도 재미있게 해요!', 'आज रमाइलो गरौं!'),
 'yay_youre_here': T("You're here, yay!", 'きてくれたね、やったー！', '왔네요, 야호!', 'तिमी आयौ, याहू!'),
 'missed_you': T("I missed you!", 'あいたかったよ！', '보고 싶었어요!', 'तिम्रो याद आयो!'),
 'so_happy': T("I'm so happy you came!", 'きてくれて うれしい！', '와 줘서 정말 기뻐요!', 'तिमी आएकोमा धेरै खुसी छु!'),
 'ready': T("Are you ready? Let's learn!", 'じゅんびは いい？ まなぼう！', '준비됐어요? 같이 배워요!', 'तयार? सिकौं!'),
 'game_first': T("Let's play a game first!", 'まずは ゲームを しよう！', '먼저 게임해요!', 'पहिले खेल खेलौं!'),
 'remember': T('Remember this?', 'これ、おぼえてる？', '이거 기억나요?', 'यो याद छ?'),
 'look': T('Look!', 'みて！', '봐요!', 'हेरौं त!'),
 'listen': T('Listen.', 'きいてね。', '들어 봐요.', 'सुनौं है।'),
 'again': T('Again!', 'もういちど！', '다시 한 번!', 'फेरि!'),
 'say_with_me': T('Say it with me!', 'いっしょに いってみよう！', '같이 말해요!', 'सँगै भनौं!'),
 'your_turn': T('Your turn!', 'つぎは きみの ばん！', '이제 해 볼까요?', 'अब तिम्रो पालो!'),
 'slowly': T('Slowly now.', 'ゆっくりね。', '천천히요.', 'बिस्तारै।'),
 'louder': T('Louder!', 'もっと おおきな こえで！', '더 크게!', 'अझ ठूलो स्वरमा!'),
 'whisper': T('Whisper it!', 'こっそり いってみて！', '속삭여 봐요!', 'सानो स्वरमा भनौं!'),
 'do_what_i_do': T('Do what I do!', 'まねしてね！', '따라 해요!', 'मसँगै गरौं!'),
 'tap_it': T('Tap it!', 'タッチしてね！', '눌러 봐요!', 'थिचौं त!'),
 'find_it': T('Find it!', 'さがしてみて！', '찾아봐요!', 'खोजौं त!'),
 'which_one': T('Which one?', 'どれかな？', '어느 거예요?', 'कुन चाहिँ?'),
 'count_with_me': T('Count with me!', 'いっしょに かぞえよう！', '같이 세어 봐요!', 'सँगै गन!'),
 'lets_sing': T("Let's sing!", 'うたおう！', '노래해요!', 'गीत गाऔं!'),
 'story_time': T('Story time!', 'おはなしの じかん！', '이야기 시간!', 'कथा सुन्ने बेला!'),
 'yes': T('Yes!', 'そう！', '맞아요!', 'हो!'),
 'thats_right': T("That's right!", 'せいかい！', '정답이에요!', 'ठीक हो!'),
 'great_job': T('Great job!', 'よくできました！', '잘했어요!', 'स्याबास!'),
 'wow': T('Wow!', 'わあ！', '와!', 'वाह!'),
 'super': T('Super!', 'すごい！', '최고예요!', 'एकदम राम्रो!'),
 'so_clever': T("You're so clever!", 'かしこいね！', '정말 똑똑해요!', 'कति बाठो!'),
 'well_done': T('Well done!', 'じょうず！', '아주 잘했어요!', 'धेरै राम्रो!'),
 'high_five': T('High five!', 'ハイタッチ！', '하이파이브!', 'हाई फाइभ!'),
 'you_remembered': T('You remembered!', 'おぼえてたね！', '기억했네요!', 'याद रह्यो!'),
 'oops_look_again': T("Oops! Let's look again.", 'あれれ？ もういちど みてみよう。', '어? 다시 봐요.', 'ओहो! फेरि हेरौं।'),
 'try_another': T('Hmm, try another one!', 'うーん、ほかのも ためしてみて！', '음, 다른 걸 눌러 봐요!', 'ह्म्म, अर्को थिचौं त!'),
 'here_it_is': T('Look, here it is!', 'ほら、ここだよ！', '봐요, 여기 있어요!', 'हेरौं, यहाँ छ!'),
 'almost': T('Almost!', 'おしい！', '아깝다!', 'झन्डै!'),
 'next_one': T('Next one!', 'つぎ！', '다음!', 'अर्को!'),
 'last_one': T('Last one!', 'さいごだよ！', '마지막이에요!', 'अन्तिम!'),
 'got_star': T('You got a star!', 'ほしを もらったよ！', '별을 받았어요!', 'तिमीले तारा पायौ!'),
 'pet_closer': T('Your new friend is getting closer!', 'あたらしい ともだちに もうすぐ あえるよ！', '새 친구가 다가오고 있어요!', 'नयाँ साथी नजिकै आउँदैछ!'),
 'learned_so_much': T('You learned so much today!', 'きょうは いっぱい まなんだね！', '오늘 많이 배웠어요!', 'आज धेरै सिक्यौ!'),
 'see_you_tomorrow': T('See you tomorrow!', 'また あしたね！', '내일 또 만나요!', 'भोलि भेटौंला!'),
 'bye': T('Bye-bye!', 'バイバイ！', '안녕!', 'टाटा!'),
}
INTRO_SELF = {
 'asha': T("I'm Didi Asha!", 'わたしは アシャ ねえさん！', '저는 아샤 선생님이에요!', 'म आशा दिदी!'),
 'leo':  T("I'm Dai Leo!", 'ぼくは レオ にいさん！', '저는 레오 선생님이에요!', 'म लियो दाइ!'),
}

PETS = {
 'beep': T('Beep', 'ビープ', '비프', 'बिप'), 'gaju': T('Gaju', 'ガジュ', '가주', 'गजु'),
 'sparky': T('Sparky', 'スパーキー', '스파키', 'स्पार्की'), 'bobo': T('Bobo', 'ボボ', '보보', 'बोबो'),
 'himu': T('Himu', 'ヒム', '히무', 'हिमु'), 'mimi': T('Mimi', 'ミミ', '미미', 'मिमी'),
 'pandu': T('Pandu', 'パンドゥ', '판두', 'पण्डु'), 'stardust': T('Stardust', 'スターダスト', '스타더스트', 'स्टारडस्ट'),
 'roary': T('Roary', 'ローリー', '로리', 'रोरी'),
}
PET_SHARED = {
 'hi_friend': T('Hi, friend!', 'やあ、ともだち！', '안녕, 친구!', 'नमस्ते साथी!'),
 'yay_here': T("Yay, you're here!", 'わーい、きてくれた！', '야호, 왔구나!', 'याहू, तिमी आयौ!'),
 'learn_together': T("Let's learn together!", 'いっしょに まなぼう！', '같이 배우자!', 'सँगै सिकौं!'),
 'start_today': T("Let's start today's lesson!", 'きょうの レッスンを はじめよう！', '오늘 수업 시작하자!', 'आजको पाठ सुरु गरौं!'),
 'yay': T('Yay!', 'やったー！', '야호!', 'याहू!'),
 'you_did_it': T('You did it!', 'できたね！', '해냈어!', 'तिमीले गर्यौ!'),
 'great_job': T('Great job!', 'すごいね！', '잘했어!', 'स्याबास!'),
 'so_clever': T('Wow, so clever!', 'わあ、かしこい！', '와, 똑똑하다!', 'वाह, कति बाठो!'),
 'high_five': T('High five!', 'ハイタッチ！', '하이파이브!', 'हाई फाइभ!'),
 'oopsie': T('Oopsie! Try again!', 'あれれ？ もういっかい！', '앗! 다시 해 보자!', 'ओहो! फेरि गरौं त!'),
 'you_can': T('You can do it!', 'きみなら できるよ！', '할 수 있어!', 'तिमी सक्छौ!'),
 'ill_help': T("I'll help you!", 'てつだうよ！', '내가 도와줄게!', 'म मद्दत गर्छु!'),
 'your_turn': T('Your turn!', 'きみの ばんだよ！', '네 차례야!', 'तिम्रो पालो!'),
 'say_it': T('Say it, say it!', 'いってみて、いってみて！', '말해 봐, 말해 봐!', 'भनौं न, भनौं न!'),
 'listening': T("I'm listening!", 'きいてるよ！', '듣고 있어!', 'म सुन्दैछु!'),
 'again_again': T('Again, again!', 'もういっかい、もういっかい！', '또, 또!', 'फेरि, फेरि!'),
 'like_word': T('I like that word!', 'その ことば だいすき！', '그 말 좋아!', 'मलाई त्यो शब्द मन पर्यो!'),
 'got_star': T('You got a star!', 'ほしを ゲット！', '별 받았다!', 'तारा पायौ!'),
 'proud': T("I'm so proud of you!", 'きみの こと ほこらしいよ！', '네가 정말 자랑스러워!', 'मलाई तिमीमा गर्व छ!'),
 'hooray': T('Hooray!', 'ばんざい！', '만세!', 'हुर्रे!'),
 'see_you': T('See you tomorrow!', 'また あしたね！', '내일 또 만나!', 'भोलि भेटौंला!'),
 'bye': T('Bye-bye!', 'バイバイ！', '안녕!', 'टाटा!'),
 'tickles': T('Hee hee, that tickles!', 'くすぐったい！', '히히, 간지러워!', 'हिहि, काउकुती लाग्यो!'),
 'love_you': T('I love you!', 'だいすき！', '사랑해!', 'म तिमीलाई माया गर्छु!'),
 'lets_play': T("Let's play!", 'あそぼう！', '놀자!', 'खेलौं!'),
 'happy_meet': T("I'm so happy to meet you!", 'あえて うれしい！', '만나서 정말 기뻐!', 'भेटेर धेरै खुसी लाग्यो!'),
}
PET_OWN = {
 'beep': [T('Beep boop! Learning mode on!', 'ピポパ！ がくしゅうモード オン！', '삐빅! 공부 모드 켜짐!', 'बिप बुप! सिक्ने मोड अन!'),
          T('My circuits are so happy!', 'ぼくの かいろが よろこんでる！', '내 회로가 신났어!', 'मेरो सर्किट खुसी भयो!'),
          T('Beep! Did I get it right?', 'ピッ！ あってた？', '삑! 내가 맞았어?', 'बिप! मैले ठीक भनेँ?'),
          T('Battery full of love!', 'あいで バッテリー まんたん！', '사랑으로 배터리 가득!', 'मायाले ब्याट्री फुल!')],
 'gaju': [T('A big elephant hug for you!', 'ぞうさんの おおきな ハグ！', '코끼리 큰 포옹!', 'तिमीलाई हात्तीको ठूलो अँगालो!'),
          T('I never forget a word!', 'ことばは ぜったい わすれないよ！', '나는 단어를 절대 안 잊어!', 'म कुनै शब्द बिर्सिन्नँ!'),
          T("Slowly, slowly, we've got this.", 'ゆっくり ゆっくり、だいじょうぶ。', '천천히, 천천히, 우리는 할 수 있어.', 'बिस्तारै बिस्तारै, हामी सक्छौं।'),
          T("You're as smart as an elephant!", 'ぞうさんみたいに かしこいね！', '코끼리처럼 똑똑해!', 'तिमी हात्ती जस्तै बाठो!')],
 'sparky': [T('Fwoosh! That was awesome!', 'ボワッ！ さいこう！', '화르륵! 최고야!', 'फुस्स! गजब भयो!'),
            T('Adventure time!', 'ぼうけんの じかんだ！', '모험 시간이야!', 'साहसिक यात्राको बेला!'),
            T("I'm a brave little dragon!", 'ぼくは ゆうかんな ちいさな ドラゴン！', '나는 용감한 꼬마 용!', 'म बहादुर सानो ड्र्यागन!'),
            T("Let's fly to the next one!", 'つぎへ とんでいこう！', '다음으로 날아가자!', 'अर्कोमा उडौं!')],
 'bobo': [T('Ooh-ooh! Banana for you!', 'ウキキ！ バナナ あげる！', '우끼끼! 바나나 줄게!', 'उ उ! तिमीलाई केरा!'),
          T("Let's swing to the next one!", 'つぎへ ブランコみたいに いこう！', '다음으로 휙 넘어가자!', 'अर्कोमा झुन्डिँदै जाऔं!'),
          T('That was so funny!', 'おもしろかった！', '정말 웃겼어!', 'कति रमाइलो!'),
          T('Monkey see, monkey do!', 'まねっこ まねっこ！', '따라쟁이 원숭이!', 'बाँदरले देख्यो, बाँदरले गर्यो!')],
 'himu': [T('Brrr, but my heart is warm!', 'ブルブル、でも こころは ぽかぽか！', '부르르, 그래도 마음은 따뜻해!', 'ठिहि, तर मेरो मन न्यानो छ!'),
          T('Snowball high five!', 'ゆきだま ハイタッチ！', '눈덩이 하이파이브!', 'हिउँको बल हाई फाइभ!'),
          T("I'm big but a little shy.", 'おおきいけど ちょっと はずかしがりや。', '나는 크지만 조금 수줍어.', 'म ठूलो छु तर अलि लजालु।'),
          T("Let's learn, nice and cosy.", 'ぬくぬく まなぼう。', '포근하게 배워 보자.', 'न्यानो गरी सिकौं।')],
 'mimi': [T('Meow! Purrfect!', 'ニャー！ かんぺき！', '야옹! 완벽해!', 'म्याउ! एकदम ठीक!'),
          T('Pounce on it!', 'えいっ、とびつこう！', '냥, 덮쳐!', 'झम्टिहाल!'),
          T('Kitten cuddles!', 'こねこの ぎゅー！', '아기 고양이 포옹!', 'बिरालाको अँगालो!'),
          T('My whiskers are wiggling!', 'ひげが ぴくぴく！', '수염이 씰룩씰룩!', 'मेरा जुँगा हल्लिँदैछन्!')],
 'pandu': [T('Snack break? Just kidding!', 'おやつ？ うそだよ！', '간식 시간? 농담이야!', 'खाजा? ठट्टा गरेको!'),
           T("Yawn... no, I'm awake!", 'ふあ～… ううん、おきてるよ！', '하암… 아니, 안 졸려!', 'हाई… होइन, म ब्युँझेकै छु!'),
           T('Cuddle time!', 'ぎゅーの じかん！', '꼭 안아 줄 시간!', 'अँगालो हाल्ने बेला!'),
           T('Soft and slow, here we go.', 'ゆっくり ふんわり、いくよ。', '살살 천천히, 가 보자.', 'बिस्तारै बिस्तारै, जाऔं।')],
 'stardust': [T('Sparkle, sparkle!', 'キラキラ！', '반짝반짝!', 'टिलिक टिलिक!'),
              T("That's magical!", 'まほうみたい！', '마법 같아!', 'जादु जस्तै!'),
              T("Let's add some colour!", 'いろを つけよう！', '색깔을 칠해 보자!', 'रङ थपौं!'),
              T('Make a wish!', 'おねがいごと しよう！', '소원을 빌어 봐!', 'इच्छा माग!')],
 'roary': [T("Roar! You're a champion!", 'ガオー！ きみは チャンピオン！', '어흥! 너는 챔피언!', 'ह्वाँ! तिमी च्याम्पियन!'),
           T('Be brave, little friend!', 'ゆうきを だして、ちいさな ともだち！', '용기를 내, 꼬마 친구!', 'साहसी बन, सानो साथी!'),
           T('King of learning!', 'まなびの おうさま！', '공부왕!', 'सिकाइको राजा!'),
           T("Let's roar it loud!", 'おおきな こえで ガオー！', '크게 어흥 하자!', 'ठूलो स्वरमा ह्वाँ गरौं!')],
}

BEEP_INTRO = [
 ('asha', T("Hello! I'm Didi Asha.", 'こんにちは！ わたしは アシャ ねえさん。', '안녕하세요! 저는 아샤 선생님이에요.', 'नमस्ते! म आशा दिदी।')),
 ('leo', T("And I'm Dai Leo! Hello!", 'ぼくは レオ にいさん！ こんにちは！', '저는 레오 선생님이에요! 안녕하세요!', 'अनि म लियो दाइ! नमस्ते!')),
 ('asha', T("Ooh! What's this?", 'あれ？ これ なあに？', '어? 이게 뭐지?', 'ए! यो के हो?')),
 ('beep', T('Beep boop! Hello!', 'ピポパ！ こんにちは！', '삐빅! 안녕!', 'बिप बुप! नमस्ते!')),
 ('leo', T('This is Beep! Beep is your friend.', 'ビープだよ！ ビープは きみの ともだち。', '비프예요! 비프는 네 친구예요.', 'यो बिप हो! बिप तिम्रो साथी।')),
 ('beep', T("Hi, friend! Let's learn together!", 'やあ、ともだち！ いっしょに まなぼう！', '안녕, 친구! 같이 배우자!', 'ए साथी! सँगै सिकौं!')),
 ('asha', T('Say hello to Beep! Hello!', 'ビープに こんにちは って いってみて！ こんにちは！', '비프한테 인사해요! 안녕!', 'बिपलाई नमस्ते भनौं! नमस्ते!')),
 ('beep', T('Yay! Beep boop!', 'やったー！ ピポパ！', '야호! 삐빅!', 'याहू! बिप बुप!')),
]
UNLOCK = {
 'did_it_20': T('You did it! Twenty lessons!', 'やったね！ 20かい できた！', '해냈어요! 스무 번이나!', 'तिमीले गर्यौ! बीस पाठ!'),
 'who_new_friend': T('Who will be your new friend?', 'あたらしい ともだちは だれかな？', '새 친구는 누굴까요?', 'नयाँ साथी को होला?'),
 'hooray': T('Hooray!', 'ばんざい！', '만세!', 'हुर्रे!'),
}
def this_is(p):
    n = PETS[p]
    return T(f"This is {n['en']}!", f"{n['ja']} だよ！", f"{n['ko']}예요!", f"यो {n['ne']} हो!")

STORIES = {
 'who_says_hello': ('leo', [
  ('narr', T('Beep goes for a walk.', 'ビープが おさんぽ。', '비프가 산책해요.', 'बिप घुम्न जान्छ।')),
  ('beep', T('Hello!', 'こんにちは！', '안녕!', 'नमस्ते!')),
  ('narr', T('A dog! The dog says woof.', 'いぬだ！ いぬは ワンワン。', '강아지예요! 강아지는 멍멍.', 'कुकुर! कुकुर भन्छ भुक भुक।')),
  ('narr', T('A cat! The cat says meow.', 'ねこだ！ ねこは ニャー。', '고양이예요! 고양이는 야옹.', 'बिरालो! बिरालो भन्छ म्याउ।')),
  ('narr', T('A cow! The cow says moo.', 'うしだ！ うしは モーモー。', '소예요! 소는 음매.', 'गाई! गाई भन्छ म्बाँ।')),
  ('narr', T('A bird! The bird says tweet.', 'とりだ！ とりは ピヨピヨ。', '새예요! 새는 짹짹.', 'चरा! चरा भन्छ चिरबिर।')),
  ('narr', T('An elephant and a monkey!', 'ぞうと さる！', '코끼리랑 원숭이!', 'हात्ती र बाँदर!')),
  ('narr', T('Everyone says hello!', 'みんなで こんにちは！', '모두 안녕!', 'सबैले भन्छन् नमस्ते!')),
  ('beep', T('Hello, friends! Bye-bye!', 'こんにちは、みんな！ バイバイ！', '안녕, 친구들! 안녕!', 'नमस्ते साथीहरू! टाटा!')),
 ]),
 'beeps_big_day': ('leo', [
  ('narr', T("It's Beep's big day!", 'きょうは ビープの とくべつな ひ！', '오늘은 비프의 특별한 날이에요!', 'आज बिपको खास दिन!')),
  ('beep', T('Hello! My name is Beep!', 'こんにちは！ ぼくの なまえは ビープ！', '안녕! 내 이름은 비프야!', 'नमस्ते! मेरो नाम बिप हो!')),
  ('narr', T('Beep sees a red apple and a yellow banana.', 'ビープは あかい りんごと きいろい バナナを みつけた。', '비프가 빨간 사과랑 노란 바나나를 봐요.', 'बिपले रातो स्याउ र पहेँलो केरा देख्छ।')),
  ('beep', T('Yummy!', 'おいしそう！', '맛있겠다!', 'मीठो!')),
  ('narr', T('Mom gives Beep rice and an egg.', 'ママが ビープに ごはんと たまごを くれた。', '엄마가 비프에게 밥이랑 달걀을 줘요.', 'आमाले बिपलाई भात र अण्डा दिनुहुन्छ।')),
  ('beep', T('Thank you!', 'ありがとう！', '고마워요!', 'धन्यवाद!')),
  ('narr', T('Dad gives Beep milk and water.', 'パパが ぎゅうにゅうと みずを くれた。', '아빠가 우유랑 물을 줘요.', 'बुबाले दूध र पानी दिनुहुन्छ।')),
  ('narr', T('A blue fish, a green butterfly, a black and white cow!', 'あおい さかな、みどりの ちょうちょ、しろくろの うし！', '파란 물고기, 초록 나비, 하얗고 검은 소!', 'निलो माछा, हरियो पुतली, कालो र सेतो गाई!')),
  ('beep', T('I love my big day! Bye-bye!', 'とくべつな ひ、だいすき！ バイバイ！', '특별한 날 정말 좋아! 안녕!', 'मलाई मेरो खास दिन मन पर्यो! टाटा!')),
 ]),
}

# ---------------------------------------------------------------- build the files
lines = {l: [] for l in L}
def add(lid, speaker, t, section):
    for l in L:
        lines[l].append({'id': lid, 'speaker': speaker, 'text': t[l], 'en': t['en'], 'section': section})

course = {'unit': 1, 'title': 'First Words', 'lessons': []}
for n, lead, words, ph in LESSONS:
    lesson = {'n': n, 'lead': lead}
    if isinstance(words, list):
        lesson.update(type='teach', words=words, phrase=f'ph.{ph[1:]}')
        for w in words:
            for kind, t in word_lines(w).items():
                add(f'w.{w}.{kind}', lead, t, f'Lesson {n} words')
        if ph in PHRASES:
            for sp in ('asha', 'leo'):
                add(f'ph.{ph[1:]}.{sp}', sp, PHRASES[ph], f'Lesson {n} phrase')
        for sp, t in PHRASE_BY_SPEAKER.get(ph, {}).items():
            add(f'ph.{ph[1:]}.{sp}', sp, t, f'Lesson {n} phrase')
    else:
        parts = words.split('+')
        lesson['type'] = parts[0]
        for p in parts[1:]:
            if p.startswith('story:'):
                lesson['story'] = p[6:]
            if p == 'unlock':
                lesson['unlock'] = True
    course['lessons'].append(lesson)

for sp in ('asha', 'leo'):
    add(f't.intro_self.{sp}', sp, INTRO_SELF[sp], 'Teacher lines')
    for k, t in TEACH.items():
        add(f't.{k}.{sp}', sp, t, 'Teacher lines')
for i, (sp, t) in enumerate(BEEP_INTRO, 1):
    add(f'beep_intro.{i}', sp, t, 'Beep arrives (lesson 1)')
for sp in ('asha', 'leo'):
    for k, t in UNLOCK.items():
        add(f'unlock.{k}.{sp}', sp, t, 'Pet unlock')
    for p in PETS:
        if p != 'beep':
            add(f'unlock.this_is_{p}.{sp}', sp, this_is(p), 'Pet unlock')
for sid, (narr, rows) in STORIES.items():
    for i, (sp, t) in enumerate(rows, 1):
        add(f'story.{sid}.{i}', narr if sp == 'narr' else sp, t, f'Story: {sid}')
for p in PETS:
    for k, t in PET_SHARED.items():
        add(f'pet.{p}.{k}', p, t, f'Pet: {p}')
    for i, t in enumerate(PET_OWN[p], 1):
        add(f'pet.{p}.own{i}', p, t, f'Pet: {p}')

CHECKS = {'bye': 'several everyday choices for a toddler', 'mom': 'or おかあさん / other common word',
          'dad': 'or おとうさん / other common word', 'milk': 'or ミルク', 'thankyou': 'polite or casual?',
          'please': 'depends on the sentence'}
for l in L:
    pack = {'language': l, 'unit': 1,
            '_note': 'Unit 1 script. A native speaker checks every line before audio is made.',
            'lines': [{'id': r['id'], 'speaker': r['speaker'], 'text': r['text']} for r in lines[l]]}
    with open(os.path.join(ROOT, 'content', 'packs', l, 'lines.json'), 'w', encoding='utf-8') as f:
        json.dump(pack, f, ensure_ascii=False, indent=1)

os.makedirs(os.path.join(ROOT, 'content', 'course'), exist_ok=True)
with open(os.path.join(ROOT, 'content', 'course', 'unit1.json'), 'w', encoding='utf-8') as f:
    json.dump(course, f, ensure_ascii=False, indent=1)

os.makedirs(os.path.join(ROOT, 'content', 'review'), exist_ok=True)
for l in L:
    with open(os.path.join(ROOT, 'content', 'review', f'unit1_{l}.csv'), 'w', encoding='utf-8-sig', newline='') as f:
        wtr = csv.writer(f)
        wtr.writerow(['id', 'section', 'speaker', 'English meaning', 'Line to record', 'OK? (yes / fix)', 'Correct line (if fix)', 'Notes'])
        for r in lines[l]:
            note = next(('Please check: ' + c for k, c in CHECKS.items() if r['id'].startswith(f'w.{k}.')), '')
            wtr.writerow([r['id'], r['section'], r['speaker'], r['en'], r['text'], '', '', note])

print({l: len(lines[l]) for l in L})
print(dict(Counter(r['speaker'] for r in lines['en'])))
print('characters:', {l: sum(len(r['text']) for r in lines[l]) for l in L})
