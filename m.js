File = new Meteor.Collection("files");
Annotations = new Meteor.Collection('annotations');

if (Meteor.isClient) {
  Session.set('Source.Annotation.editing', null)
    Session.set("creatingNewFile", false);

    Handlebars.registerHelper('index', function() {
        return Meteor.Router.page() === "landing";
    });

    Handlebars.registerHelper('isDir', function(type) {
      return type === "tree";
    })

    Meteor.startup(function() {
      Meteor.Router.add({
        '/': function() {
          if (Meteor.user()) {
            return 'home';
          } else {
            return 'landing';
          }
        },
        '/home': 'home',
        '/new': 'newFile',
        '/github': 'github',
        '/show/:id': function(id) {
          Session.set('fileID', id);
          return 'show';
        } 
      });
      setTimeout(function() {
        Meteor.Router.to(window.location.pathname)
      }, 500)
    }); 


    Meteor.Router.filters({
      'checkLoggedIn': function(page) {
        if (Meteor.user()) {
          return page;
        } else {
          return 'landing';
        }
      }
    });
    Meteor.Router.filter('checkLoggedIn', {only: 'home'});

    Template.newFile.events({
      'click #submit-new-file' : function(ev, page) {
        var textbox = $('#newFileEntry');
        var titlebox = $('#title');
        var file = $(textbox).val();
        var title = titlebox.val();
        if (file === "") return;

        var language = hljs.highlightAuto(file).language;

        File.insert({ 
          'file' : $.trim(file), 
          shared: [], 
          author: Meteor.userId(), 
          language: language,
          title: title
        }, function(error, result) {
          if (error) {
            alert('An unknown error occurred');
          } else {
            console.log( File.find(result).fetch()[0] )
            Meteor.Router.to('/show/' + result);
          }
        });
      },

      'keydown #newFileEntry' : function(ev, page) {
        if(ev.keyCode==9) {
          ev.preventDefault();
          insertAtCaret("newFileEntry","    ");
        }
      }

    });

    $(document).click(function() {
        $(".annotations").hide();
    });

    Template.annotations.events({
      'click *' : function(ev) {
        ev.stopPropagation();
      }
    });

    Template.show.events({
      'click .line' : function(ev) {
        $(".annotations").show();
        $target = $(ev.target).parents('.line');
        var lineId = $target.data('id');
        Session.set('lineAnnotationNumber', lineId);

        var $line = $target.find('code'),
          $container = $('.snippet');

        $target.find('pre').addClass('selected');

        Session.set('Source.Annotation.annoCSS', {
          top: $line.offset().top + $line.height() / 2,
          left: $container.position().left + $container.width(),
          overflow: "display",
          width: $(window).width() - $container.offset().left - $container.width() - 20
        });

        $('.annotations').css(Session.get('Source.Annotation.annoCSS'));

        ev.stopPropagation();
      },
      'keydown #annotation, click #annotateBtn' : function(ev) {
        var keyCode = ev.keyCode || ev.which;
        if ( (keyCode == 13 || ev.type == "click") && !event.shiftKey) {
          Annotations.insert({ 
            author: Meteor.user(), 
            file: Session.get('fileID'),
            line: Session.get('lineAnnotationNumber'),
            text: $("#annotation").val()
          }, function(error, result) {
            if (error) {
              alert("An unknown error has occurred");
            } else {
              $("#annotation").val('');
              ev.preventDefault();
              ev.stopPropagation();
            }
          });
        }
      }
    });

    Template.annotation.rendered = function() {
      var textarea
      if ( ( textarea = $('textarea[data-id='+ Session.get('Source.Annotation.editing') +']') ).length ) {
        textarea.setSelection(textarea.val().length);
      }
    }

    Template.annotation.events({
      'click .edit span' : function(ev) {
        Session.set("Source.Annotation.editing", $(ev.target).data('id'));
      },
      'keydown textarea' : function(ev) {
        var keyCode = ev.keyCode || ev.which;
        if (keyCode == 13 && !event.shiftKey) {
          var text = $(ev.target).val();
          Session.set("Source.Annotation.editing", null);
          Annotations.update( $(ev.target).data('id'),{$set : {text: text } });
        }
      },
      'click .delete span' : function(ev) {
        Annotations.remove($(ev.target).data('id'));
      }
    });

    Template.user.loggedIn = Template.home.loggedIn = function() {
      return SessionAmplify.get("loggedIn");
    }

    Template.sourceSynopsisTemplate.prettifyTitle = function(title) {
      return title ? title : 'untitled'
    }

    Template.show.prettyTitle = function() {
      var title = File.find(Session.get('fileID')).fetch()[0].title ;
      return title ? title : 'untitled';
    }

    Template.show.authorPhoto = function() {
      return Meteor.users.find(
        File.find(Session.get('fileID')).fetch()[0].author
      ).fetch()[0].profile.propic;
    }
    Template.sourceSynopsisTemplate.authorPhoto = function(id) {
      return Meteor.users.find(id).fetch()[0].profile.propic;
    }

    Template.show.canWatch = function() {
      var file = File.find(Session.get('fileID')).fetch()[0];
      return file.author != Meteor.userId() && !_.contains(file.shared, Meteor.userId());
    }

    Template.show.canUnwatch = function() {
      var file = File.find(Session.get('fileID')).fetch()[0];
      return file.author != Meteor.userId() && _.contains(file.shared, Meteor.userId());
    }

    Template.show.events({
      'click #watch' : function(ev) {
        File.update(Session.get('fileID'), { $push: { shared: Meteor.userId() } });
      },
      'click #unwatch': function(ev) {
        var file = File.find(Session.get('fileID')).fetch()[0];
        file.shared.splice(file.shared.indexOf(Meteor.userId()))
        File.update(file._id, { $set: { shared : file.shared } });
      }
    })

    Template.home.creatingNewFile = function() {
      return Session.get('creatingNewFile');
    }

    Template.annotation.canEdit = function(annotation) {
      return Meteor.userId() == annotation.author._id;
    }

    Template.annotation.editing = function(annotation) {
      return Session.get("Source.Annotation.editing") == annotation._id;
    }

    Template.annotations.annos = function() {
      return Annotations.find({
        'line': Session.get('lineAnnotationNumber'), 
        'file': Session.get('fileID')
      }).fetch();
    }

    Template.annotations.hasAnnotations = function() {
      return Template.annotations.annos().length !== 0;
    }

  Template.github.username = function() {
    return Meteor.user().profile.username;
  }

  Template.github.repoitems = function() {
    return Session.get("repoitems");
  }

  var getRepos = function(page) {
    // get repos from this user
    var username = $(page.find("#username"))[0].value;
    HTTP.call("GET", "https://api.github.com/users/"+username+"/repos?access_token="+
              Meteor.user().services.github.accessToken,
      {params:{sort:"updated"}}, function (error, result) {
        if (result.statusCode === 200) {
          console.log(result);
          Session.set("repoitems",result.data);
          Session.set("repomode","repo");
          Session.set("repouser",username);
          Session.set("repopath","");
        }
    });
  }

  var getTree = function(user,repo,sha) {
    HTTP.call("GET", "https://api.github.com/repos/"+user+"/"+repo+"/git/trees/"+sha+ "?access_token="+
              Meteor.user().services.github.accessToken,
      function (error, result) {
        if (result.statusCode === 200) {
          console.log(result);
          Session.set("repoitems",result.data.tree);
        }
    });
  }

  var saveGithubFile = function(user,repo,filename) {
    Meteor.call("getFileFromGithub",user,repo,filename,function(error,result){
      var file = result.content;
      var language = hljs.highlightAuto(file).language;

      File.insert({ 'file' : file, shared: [], author: Meteor.userId(), title: filename, language: language }, function(error, result) {
        if (error) {
          alert('An unknown error occurred');
        } else {
          Meteor.Router.to('/show/' + result);
        }
      });
    });
  }

  var getRootSHA = function(user,repo) {
    HTTP.call("GET", "https://api.github.com/repos/"+user+"/"+repo+"/commits?access_token="+
              Meteor.user().services.github.accessToken,
      function (error, result) {
        if (result.statusCode === 200) {
          console.log(result.data[0].sha);
          getTree(user,repo,result.data[0].sha);
        }
    });
  }

  Template.github.events({
    'click button' : function(ev,page) {
      getRepos(page);
    },
    'keydown input' : function(ev,page) {
      if(ev.keyCode==13) {
        getRepos(page);
      }
    },
    'click .itemrow' : function(ev,page) {
      // saveGithubFile("redfern314","sourcegenius","m.js");
      var itemname = ev.srcElement.innerText;
      var username = Session.get("repouser");
      var path = Session.get("repopath");
      var repo = Session.get("currentrepo");
      var repoitems = Session.get("repoitems");
      var curritem;

      for (var i = repoitems.length - 1; i >= 0; i--) {
        if((repoitems[i].name || repoitems[i].path) == ev.srcElement.innerText) {
          curritem=repoitems[i];
          break;
        }
      };

      console.log(curritem);
      if(Session.get("repomode")=="repo") {
        // get files in repo
        Session.set("currentrepo",itemname);
        Session.set("repomode","tree");

        console.log("repo");
        getRootSHA(username,itemname);
      } else {
        // determine whether clicked obj is file or directory
        if(curritem.type=="blob") { //file
          console.log(path+itemname);
          saveGithubFile(username,repo,path+itemname);
          console.log("blob");
        } else { //directory
          path = path+itemname+"/";
          Session.set("repopath",path);
          console.log("tree");
          getTree(username,repo,curritem.sha);
          // get new set of files
        }
      }
    }
  })

  SessionAmplify = _.extend({}, Session, {
    keys: _.object(_.map(amplify.store(), function(value, key) {
      return [key, JSON.stringify(value)]
    })),
    set: function (key, value) {
      Session.set.apply(this, arguments);
      amplify.store(key, value);
    },
  });

  Template.user.events({
    'click #signin,#propic' : function(ev, page) {
      if(SessionAmplify.get("loggedIn")) {
        SessionAmplify.set("loggedIn",false);
        Meteor.logout();
        Meteor.Router.to('/');
      } else {
        Meteor.loginWithGithub({
          requestPermissions: ['user', 'public_repo']
        }, function (err) {
          if (err) {
            Session.set('errorMessage', err.reason || 'Unknown error');
          } else {
            // get the user's avatar
            HTTP.call("GET", "https://api.github.com/user?access_token="+
              Meteor.user().services.github.accessToken,
              function (error, result) {
                if (result.statusCode === 200) {
                  SessionAmplify.set("propic", result.data.avatar_url);
                  SessionAmplify.set("loggedIn",true);
                  Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile.propic":result.data.avatar_url}})
                  Meteor.users.update({_id:Meteor.user()._id}, {$set:{"profile.username":Meteor.user().services.github.username}})
                  Meteor.Router.to('/home');
                }
            });
          }
        });
      }
    }
  })


  Template.user.URL = function() {
    return SessionAmplify.get('propic');
  }

  Template.user.loggedIn = function() {
    return SessionAmplify.get("loggedIn");
  }

  Template.show.splitLines = function() {
  	var file = File.find(Session.get('fileID')).fetch()[0];
  	var lines = File.find(Session.get('fileID')).fetch()[0].file.split("\n"),
    	resultsArray = [];
    	_.each(lines, function(line) {
        var cssClasses = "";
        if (line != "") {
          cssClasses += "line";
          if (Annotations.find({
                  'line': resultsArray.length, 
                  'file': Session.get('fileID')
                }).fetch().length > 0) {
            cssClasses += " annotated";
          }
        }
        else {
          cssClasses += "emptyLine";
        }
    		resultsArray.push({text: line, index: resultsArray.length, language: file.language, cssClasses: cssClasses});
    	});
    	return resultsArray;
  }

  Template.show.rendered = function() {
    Prism.highlightAll();
  }

  Template.home.userSources = function() {
    return File.find({ author: Meteor.userId() }).fetch();
  }

  Template.home.sharedSources = function() {
    var sources = File.find().fetch(),
      resultsArray = [];
    for (var i=0, l=sources.length; i<l; i++) {
      if (_.contains(sources[i].shared, Meteor.userId() )) {
        resultsArray.push(sources[i]);
      }
    }
    return resultsArray;
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup

    // set up the OAuth2 service
    Accounts.loginServiceConfiguration.remove({
      service: "github"
    });
    Accounts.loginServiceConfiguration.insert({
      service: "github",
      clientId: process.env.GITHUB_ID,
      secret: process.env.GITHUB_SECRET
    });

    Meteor.users.allow({
      update: function (userId, user, fields, modifier) {
        // can only change your own documents
        if(user._id === userId)
        {
          Meteor.users.update({_id: userId}, modifier);
          return true;
        }
        else return false;
      }
    });

    Meteor.methods({
      getFileFromGithub: function (user,repo,file) {
          this.unblock();
          var URL = "https://raw.github.com/"+user+"/"+repo+"/master/"+file;
          console.log(URL);
          return Meteor.http.call("GET", URL);
      }
    });

  });
}

// needed for tab to work
function insertAtCaret(areaId,text) {
    var txtarea = document.getElementById(areaId);
    var scrollPos = txtarea.scrollTop;
    var strPos = 0;
    var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ? 
      "ff" : (document.selection ? "ie" : false ) );
    if (br == "ie") { 
      txtarea.focus();
      var range = document.selection.createRange();
      range.moveStart ('character', -txtarea.value.length);
      strPos = range.text.length;
    }
    else if (br == "ff") strPos = txtarea.selectionStart;

    var front = (txtarea.value).substring(0,strPos);  
    var back = (txtarea.value).substring(strPos,txtarea.value.length); 
    txtarea.value=front+text+back;
    strPos = strPos + text.length;
    if (br == "ie") { 
      txtarea.focus();
      var range = document.selection.createRange();
      range.moveStart ('character', -txtarea.value.length);
      range.moveStart ('character', strPos);
      range.moveEnd ('character', 0);
      range.select();
    }
    else if (br == "ff") {
      txtarea.selectionStart = strPos;
      txtarea.selectionEnd = strPos;
      txtarea.focus();
    }
    txtarea.scrollTop = scrollPos;
}
