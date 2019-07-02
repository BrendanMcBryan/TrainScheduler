// console.log("connected to JS");
// Your web app's Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyCCEeRQ0wlTDvUoshHEPA-xDf89CrRFL2c",
  authDomain: "trainscheduler-bjm.firebaseapp.com",
  databaseURL: "https://trainscheduler-bjm.firebaseio.com",
  projectId: "trainscheduler-bjm",
  storageBucket: "",
  messagingSenderId: "52760181097",
  appId: "1:52760181097:web:a76414eca7b77a6a"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var database = firebase.database();

// Listen for add Train button and push data to firebase
$("#add-train-btn").on("click", function(event) {
  event.preventDefault();

  var trainName = $("#train-name-input")
    .val()
    .trim();
  var trainDestin = $("#destination-input")
    .val()
    .trim();
  var trainFirst = moment(
    $("#first-train-input")
      .val()
      .trim(),
    "hh:mm a"
  ).format("hh:mm a");
  var trainFreq = $("#frequency-input")
    .val()
    .trim();

  // Create Object and send to firebase
  var newTrain = {
    name: trainName,
    destination: trainDestin,
    firstTrain: trainFirst,
    frequency: trainFreq
  };
  database.ref().push(newTrain);

  // Clear form
  $("#train-name-input").val("");
  $("#destination-input").val("");
  $("#first-train-input").val("");
  $("#frequency-input").val("");
});

// load current trains and listen for new entries to database and then add to schedule
database.ref().on("child_added", function(childSnapshot) {
  // console.log(childSnapshot.val());

  // Store everything into a variable.
  var trainName = childSnapshot.val().name;
  var trainDestin = childSnapshot.val().destination;
  var trainFirst = moment(childSnapshot.val().firstTrain, "hh:mm a");
  var trainFirstText = trainFirst.format("hh:mm a");
  var trainFreq = childSnapshot.val().frequency;

  // Set the frequency text to be better english
  if (trainFreq < 2) {
    var trainFreqtext = trainFreq + " minute";
  } else if (trainFreq >= 2 && trainFreq < 60) {
    var trainFreqtext = trainFreq + " minutes";
  } else {
    var trainFreqtext = Math.floor(trainFreq / 60);
    if (Math.floor(trainFreq / 60) < 2) {
      trainFreqtext += " hour";
    } else {
      trainFreqtext += " hours";
    }
    if (trainFreq % 60 != 0) {
      if (trainFreq % 60 === 1) {
        trainFreqtext += " & ";
        trainFreqtext += (trainFreq % 60);
        trainFreqtext += " minute";
      } else {
        trainFreqtext += " & ";
        trainFreqtext += (trainFreq % 60);
        trainFreqtext += " minutes";
      }
    }
  }

  // Make the train name based on First train Start time and name
  // some found grep
  var trainNum = trainFirstText.replace(/\D/g, "");
  var trainNameDisplay = trainNum + " " + trainName;

  // calculate the Next arrival and make a midnight var for later styling
  var rightNow = moment();
  var midnight = moment("11:59 pm", "hh:mm a");

  // calculculate train schedule
  // this section makes an array of the remaining trains today
  var trainSched = [trainFirst];
  var scheduleNeeded = true;

  while (scheduleNeeded) {
    var nextTrain = moment(trainFirst).add(trainFreq, "m");
    while (nextTrain < midnight) {
      trainSched.push(nextTrain);
      nextTrain = moment(nextTrain).add(trainFreq, "m");
    }
    scheduleNeeded = false;
  }

  // Find the next arrival calculate minutes away

  for (const key in trainSched) {
    var missedTrains = 0;
    if (trainSched[key] < rightNow) {
      missedTrains++;
      // if there is only 1 item in the schedule then there are no more trains today.
      if (missedTrains === trainSched.length) {
        var minAway = "Tomorrow";
        var nextArrivalText = moment(trainFirst).format("h:mm a");
        break;
      }
      // console.log("missed a train");
    } else {
      var nextArrival = trainSched[key];
      var nextArrivalText = moment(nextArrival).format("h:mm a");
      var minAway = moment(nextArrival, "hh:mm a").fromNow();
      // var minAwayTrue = moment(nextArrival, "hh:mm a").fromNow(true);
      // console.log(trainNameDisplay + " " + minAwayTrue + "-true");
      var minAwayNumber = nextArrival.diff(rightNow, "m");
      break;
    }
  }

  // add new row to Current schedule
  var newRow = $("<tr>").append(
    $("<td>").text(trainNameDisplay),
    $("<td>").text(trainDestin),
    $("<td class='cntr-txt'>").text(trainFreqtext),
    $("<td class='cntr-txt'>").text(nextArrivalText),
    $("<td class='cntr-txt'>").text(minAway)
  );
  // add some classes bassed on min away

  if (minAway === "Tomorrow") {
    newRow.addClass("faded");
  } else {
    if (minAwayNumber > 31) {
    } else if (minAwayNumber < 30 && minAwayNumber > 10) {
      newRow.addClass("getready");
    } else if (minAwayNumber < 10) {
      newRow.addClass("hurry");
    }
  }

  // Append the new row to the table
  $("#current-table > tbody").append(newRow);
});
