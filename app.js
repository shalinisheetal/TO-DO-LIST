// Requiring modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

// setting app
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// connecting to database
// mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

// connecting to mongodb atlas
mongoose.connect("mongodb+srv://admin-shalini:shalini@cluster0.qlb4z.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser: true});

// schema for each task
const itemsSchema = {
  name: String
};

// task model
const Item = mongoose.model("Item", itemsSchema);

const defaultItem = new Item({
  name: "Add items to ToDo-List"
});
const defaultItems = [defaultItem];

// schema for each work list
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// list model
const List = mongoose.model("List", listSchema);

const listOfLists = ["Default"];

app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items inserted successfully");
        }
      });
      res.redirect("/");

    } else {

      List.find({}, function(err, foundLists) {
        res.render("list", {
          listDate: date.getDate(),
          listTitle: "Default",
          newListItems: foundItems,
          lists: foundLists
        });
      })

    }
  });

});

app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  if (List.findOne({
      name: customListName
    }, function(err, foundList) {
      if (!err) {
        if (!foundList) {
          // Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });

          list.save(function(err) {
            if (!err) {
              res.redirect("/" + customListName);
            }
          });

        } else {
          // Show the existing list

          List.find({}, function(err, foundLists) {
            res.render("list", {
              listDate: date.getDate(),
              listTitle: foundList.name,
              newListItems: foundList.items,
              lists: foundLists
            });

          })
        }
      }
    }));

});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Default") {

    // saving in default list
    item.save();
    res.redirect("/");
  } else {

    // else save in required list
    List.findOne({
      name: listName
    }, function(err, foundList) {

      foundList.items.push(item);
      foundList.save(function(err) {

        if (!err) {
          res.redirect("/" + listName);
        }

      });
    });
  }
});

app.post("/delete", function(req, res) {

  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Default") {
    Item.findByIdAndRemove(checkedItem, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Item deleted successfully");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      // condition
      {
        name: listName
      },
      // updation
      {
        $pull: {
          items: {
            _id: checkedItem
          }
        }
      },
      // callback
      function(err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      });
  }

});

app.post("/createList", function(req, res) {
  const listName = req.body.newList;
  res.redirect("/" + listName);
})

let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started successfully");
});
