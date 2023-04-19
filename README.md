# 메뉴 알리미 봇 ( for dooray )
whats up 복리후생 게시판을 크롤링해서 메뉴를 메신저로 알려줍니다.

whats up 접근이 가능한 사내망에서 사용하셔야 합니다.

사진데이터는 페이코 어플로만 보이고 api도 따로 없는것같아 못 넣었습니다.

앱 크롤링 시도 중 menu.payco.com이라는 도메인인것만 알아냈는데...

whatup에 로그인 과정이 포함되어 있기 때문에
whatsup id와 pw
그리고 봇의 알림을 받을 webHookURL이 필요로 합니다.

- webHookURL 조회 방법
두레이 대화방 '설정' 메뉴에서 '서비스 연동'을 선택하고 '서비스 추가' 탭에서 'incoming'의 '연동 추가' 버튼을 누릅니다. 화면에서 연동하고 싶은 대화방을 체크하고 '저장' 버튼을 누르면 해당 주소가 클립보드에 복사됩니다.


## 출력 화면
![예시](example.png)



## 설치 순서
npm install
node app.js webHookURL

ex) node app.js https://doorayt~~~....

## TODOLIST
- 배치 추가 done
- xlsx 정리 로직 
- logging 관리
- 에러 처리
- test?