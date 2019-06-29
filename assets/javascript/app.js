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

  var newTrain = {
    name: trainName,
    destination: trainDestin,
    firstTrain: trainFirst,
    frequency: trainFreq
  };
  database.ref().push(newTrain);

  // console.log(newTrain.name);
  // console.log(newTrain.destination);
  console.log(newTrain.firstTrain);
  // console.log(newTrain.frequency);

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
  var trainFreq = parseInt(childSnapshot.val().frequency, 10);

  // Make the train name based on First train Start time and name
  // some found grep
  var trainNum = trainFirstText.replace(/\D/g, "");
  var trainNameDisplay = trainNum + " " + trainName;

  // calculate the Next arrival
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
      break;
      // console.log("another train");
    }
  }

  // add new row to schedule
  var newRow = $("<tr>").append(
    $("<td>").text(trainNameDisplay),
    $("<td>").text(trainDestin),
    $("<td class='cntrtxt'>").text(trainFreq + " minutes"),
    $("<td class='cntrtxt'>").text(nextArrivalText),
    $("<td class='cntrtxt'>").text(minAway)
  );
  // add some classes bassed on min away
  // var minTest = parseInt(minAway.replace(/\D/g, ""), 10);

  // if (minAway === "Tomorrow") {
  //   newRow.addClass("faded");
  // }

  // if (minTest < 30 && minTest > 10) {
  //   newRow.addClass("getready");
  // }
  // if (minTest < 10) {
  //   newRow.addClass("hurry");
  // }

  // Append the new row to the table
  $("#current-table > tbody").append(newRow);
});
