// google drive
let saveImageFolderID = PropertiesService.getScriptProperties().getProperty("SAVE_IMAGE_FOLDER_ID");
// google spread sheet
const ss = SpreadsheetApp.getActiveSpreadsheet();

function doGet(e) {
  var userId;
  var quizNumber;
  //userNameが空なら空を返し、埋まっているなら出題を開始
  if (!e.parameter.userName) {
    response = {
      content: "initial"
    };
    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
  } else {
    var userName = e.parameter.userName;

    // user情報が存在しなければ登録
    if (!e.parameter.userId) {
      // user情報を登録
      userId = getUuid();
      registerUser(userId, userName);
    } else {
      userId = e.parameter.userId;
    }

    var userRowNumber = getUserRowNumber(userId);
    if (!e.parameter.quizNumber) {
      quizNumber = 0;
    } else {
      quizNumber = Number(e.parameter.quizNumber);
    }
    var nextQuizNumber = quizNumber + 1;
    var tfPreviousQuiz;
    var response;

    // 出題済みなら採点して正誤を取得
    if (quizNumber) {
      var userSelection = e.parameter.userSelection;
      // 採点して正誤を取得
      tfPreviousQuiz = markUserSelection(quizNumber, userSelection);
      // 正誤情報をDBに記録
      recordGrade(userRowNumber, quizNumber, tfPreviousQuiz);
    }

    if (quizNumber != 10) {
      // quiz情報を取得
      var quiz = getQuiz(nextQuizNumber);

      var quizSentence = quiz[0][0];
      var rightAnswer = quiz[0][1];
      var wrongAnswer1 = quiz[0][2];
      var wrongAnswer2 = quiz[0][3];
      var wrongAnswer3 = quiz[0][4];
      var quizThumnailUrl = quiz[0][5];

      // responseを入力
      response = {
        content: "quiz",
        previousQuizNumber: quizNumber,
        nextQuizNumber: nextQuizNumber,
        tfPreviousQuiz: tfPreviousQuiz,
        quizSentence: quizSentence,
        rightAnswer: rightAnswer,
        wrongAnswer1: wrongAnswer1,
        wrongAnswer2: wrongAnswer2,
        wrongAnswer3: wrongAnswer3,
        quizThumnailUrl: quizThumnailUrl
      };
    } else {
      var userPoint = getUserPoint(userRowNumber);
      response = {
        content: "result",
        userPoint: userPoint
      }
    }

    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
  }
}

// user情報の存在を確認
function checkUserExist(userId) {
  var rowNumber = getUserRowNumber(userId);
  if (rowNumber) {
    return true;
  } else {
    return false;
  }
}

function getUserRowNumber(userId) {
  var sheet = ss.getSheetByName('userTable');
  var rowNumber = findRowNumber(sheet, userId, 1);
  return rowNumber;
}

function testGetUserRowNumber() {
  var userId = "8543e58c-de25-46c9-84d7-94f046a2bff3";
  var userRowNumber = getUserRowNumber(userId);
  console.log(userRowNumber);
}

// 指定された要素がスプレッドシートの何行目に登録されているかを返す
function findRowNumber(sheet, val, col) {
  var dat = sheet.getDataRange().getValues(); //受け取ったシートのデータを二次元配列に取得
  var dat_length = dat.length;
  for (var i = 1; i < dat_length; i++) {
    if (dat[i][col - 1] === val) {
      return i + 1;
    }
  }
  return 0;
}

function testFindRowNumber() {
  // シートオブジェクトを取得
  var sheet = ss.getSheetByName('quizTable');
  val = "sentence";
  col = 2;
  var rowNumber = findRowNumber(sheet, val, col);
  console.log(rowNumber);
}

// 登録データ数を返す
function getDataSize(sheet) {
  var data = sheet.getDataRange().getValues(); //受け取ったシートのデータを二次元配列に取得
  var dataSize = data.length - 1;
  return dataSize;
}

function testGetDataSize() {
  var sheet = ss.getSheetByName('quizTable');
  var dataSize = getDataSize(sheet);
  console.log(dataSize);
}

// user情報を登録
function registerUser(userId, userName) {
  var sheet = ss.getSheetByName('userTable');
  var dataSize = getDataSize(sheet);
  var row = dataSize + 2;
  setTwoValues(sheet, row, 1, 1, 2, userId, userName);
}

function testRegisterUser() {
  var userId = getUuid();
  var userName = "テスト次郎";
  registerUser(userId, userName);
}

function setValue(sheet, row, col, val) {
  var range = sheet.getRange(row, col);
  range.setValue(val);
}

function setTwoValues(sheet, row1, col1, row2, col2, val1, val2) {
  var range = sheet.getRange(row1, col1, row2, col2);
  range.setValues([[val1, val2]]);
}

function getValue(sheet, row, col) {
  // セルを選択
  var range = sheet.getRange(row, col);
  // セルの値を取得
  var value = range.getValue();
  return value;
}

function getValues(sheet, row1, col1, row2, col2) {
  // セルを選択
  var range = sheet.getRange(row1, col1, row2, col2);
  var values = range.getValues();
  return values;
}

// 採点
function markUserSelection(quizNumber, userSelection) {
  var sheet = ss.getSheetByName('quizTable');
  var row = quizNumber + 1;
  var rightAnswer = getValue(sheet, row, 4);
  var tfPreviousQuiz;
  if (rightAnswer === userSelection) {
    tfPreviousQuiz = true;
  } else {
    tfPreviousQuiz = false;
  }
  return tfPreviousQuiz;
}

function testMarkUserSelectionWithTrue() {
  var quizNumber = 2;
  var userSelection = "クリームボックス";
  var tfPreviousQuiz = markUserSelection(quizNumber, userSelection);
  console.log(tfPreviousQuiz);
}

function testMarkUserSelectionWithFalse() {
  var quizNumber = 2;
  var userSelection = "純白のパン";
  var tfPreviousQuiz = markUserSelection(quizNumber, userSelection);
  console.log(tfPreviousQuiz);
}

// 正誤情報を記録
function recordGrade(userRowNumber, quizNumber, tfPreviousQuiz) {
  var sheet = ss.getSheetByName('userTable');
  var row = userRowNumber;
  var col = quizNumber + 3;
  var val = tfPreviousQuiz;
  setValue(sheet, row, col, val);
}

function testRecordGrade() {
  var userRowNumber = 3;
  var quizNumber = 1;
  var tfPreviousQuiz = true;
  recordGrade(userRowNumber, quizNumber, tfPreviousQuiz)
}

// quiz情報を取得
function getQuiz(nextQuizNumber) {
  var squizSeet = ss.getSheetByName('quizTable');
  var row = nextQuizNumber + 1
  var quiz = getValues(squizSeet, row, 3, 1, 6);
  return quiz;
}

function testGetQuiz() {
  var nextQuizNumber = 2
  var quiz = getQuiz(nextQuizNumber);
  console.log(quiz);
  console.log(quiz[0][1]);
}

// uuidを生成
function getUuid() {
  return Utilities.getUuid();
}

function getUserPoint(userRowNumber) {
  var userSheet = ss.getSheetByName('userTable');
  var resultList = getValues(userSheet, userRowNumber, 4, 1, 13)[0];
  var userPoint = 0;
  for (let i = 0; i < 10; i++) {
    if (resultList[i] === true) {
      userPoint += 1;
    }
  }
  return userPoint;
}

function testGetUserPoint() {
  var userRowNumber = 3;
  var userPoint = getUserPoint(userRowNumber);
  console.log(userPoint);
}
