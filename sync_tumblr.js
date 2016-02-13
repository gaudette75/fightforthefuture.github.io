var fs      = require('fs');
var request = require('request');
var AWS     = require('aws-sdk');
var Habitat = require('habitat');

Habitat.load('.env');

var
  path = 'site/_blog_posts/',
  awsEnv = new Habitat('aws'),
  tumblrEnv = new Habitat('tumblr');

if (
  !tumblrEnv.get('api_key')
  ||
  !awsEnv.get('access_key')
  ||
  !awsEnv.get('secret_key')
  ||
  !awsEnv.get('s3_bucket')
  ||
  !awsEnv.get('s3_folder')
  ) {
  console.log('-----------------------------------------------------------------------');
  console.log('-----------------------------------------------------------------------');
  console.log('-----------------------------------------------------------------------');
  console.log('HHHHHHHHH     HHHHHHHHHEEEEEEEEEEEEEEEEEEEEEEYYYYYYY       YYYYYYY !!! ');
  console.log('H:::::::H     H:::::::HE::::::::::::::::::::EY:::::Y       Y:::::Y!!:!!');
  console.log('H:::::::H     H:::::::HE::::::::::::::::::::EY:::::Y       Y:::::Y!:::!');
  console.log('HH::::::H     H::::::HHEE::::::EEEEEEEEE::::EY::::::Y     Y::::::Y!:::!');
  console.log('  H:::::H     H:::::H    E:::::E       EEEEEEYYY:::::Y   Y:::::YYY!:::!');
  console.log('  H:::::H     H:::::H    E:::::E                Y:::::Y Y:::::Y   !:::!');
  console.log('  H::::::HHHHH::::::H    E::::::EEEEEEEEEE       Y:::::Y:::::Y    !:::!');
  console.log('  H:::::::::::::::::H    E:::::::::::::::E        Y:::::::::Y     !:::!');
  console.log('  H:::::::::::::::::H    E:::::::::::::::E         Y:::::::Y      !:::!');
  console.log('  H::::::HHHHH::::::H    E::::::EEEEEEEEEE          Y:::::Y       !:::!');
  console.log('  H:::::H     H:::::H    E:::::E                    Y:::::Y       !!:!!');
  console.log('  H:::::H     H:::::H    E:::::E       EEEEEE       Y:::::Y        !!! ');
  console.log('HH::::::H     H::::::HHEE::::::EEEEEEEE:::::E       Y:::::Y            ');
  console.log('H:::::::H     H:::::::HE::::::::::::::::::::E    YYYY:::::YYYY     !!! ');
  console.log('H:::::::H     H:::::::HE::::::::::::::::::::E    Y:::::::::::Y    !!:!!');
  console.log('HHHHHHHHH     HHHHHHHHHEEEEEEEEEEEEEEEEEEEEEE    YYYYYYYYYYYYY     !!! ');
  console.log('-----------------------------------------------------------------------');
  console.log('-----------------------------------------------------------------------');
  console.log('-----------------------------------------------------------------------');
  console.log('');
  console.log('You are missing some environment variables. That means your build isn\'t');
  console.log('syncing posts from Tumblr API. Check out example.env for instructions.');
  console.log('');
  console.log('-----------------------------------------------------------------------');
  process.exit();
}

AWS.config.update({
    accessKeyId: awsenv.get('access_key').trim(),
    secretAccessKey: awsenv.get('secret_key').trim()
});

var getPosts = function(offset) {

  console.log('Asking Tumblr API for 20 posts, offset: '+ offset + '...');

  var url = 'https://api.tumblr.com/v2/blog/fight4future.tumblr.com/posts/text?api_key='+tumblrEnv.get('api_key').trim()+'&offset='+offset;

  request(url, function(err, httpResponse, body) {
    if (err || httpResponse.statusCode != 200) {
      console.log('TUMBLR API ERROR:', body);
      process.exit(1);
    }
    var data = JSON.parse(body);
    var posts = data.response.posts;

    console.log('Parsing results...');

    for (var i = 0; i < posts.length; i++) {

      if (posts[i].state != 'published')
        continue;

      var date  = posts[i].date.substr(0, posts[i].date.indexOf(' '));
      var slug  = posts[i].slug;
      var file  = date + '-' + slug + '.html';
      var front = '---\n'

      front += 'layout: blog-post\n';
      front += 'header: true\n';

      if (posts[i].title)
        front += 'title: \''+safeQuote(posts[i].title)+'\'\n';

      front += 'date: '+posts[i].date+'\n';
      front += '---\n';

      console.log("• " + date + ': ' + posts[i].title);

      try {
        fs.accessSync(postPath + file);
        // fs.accessSync(postPath + file + 'LOOLL'); // JL HACK ~ always resync
        console.log('  - POST ALREADY EXISTS: ' + postPath + file);
        console.log('  - nothing else to do lol');
        return;
      } catch (err) {

        // oh tumblr is cranky about hotlinking images, so we have to re-host
        var regexp  = /<img[^>]+src="?([^"\s]+)"?\s*\/>/g;

        // copy all tumblr images to S3 and then re-write our <img> src URLs
        while (m = regexp.exec(posts[i].body)) {
          var url      = m[1];
          var filename = url.substring(url.lastIndexOf('/')+1);
          var path     = awsEnv.get('s3_folder').trim() + '/' + filename;
          var newUrl = '//' + awsEnv.get('s3_bucket').trim() + '/' + path;

          console.log('  - Rehosting image: ' + url + ' => ' + newUrl);
          copyImageToS3(url, path);

          posts[i].body = posts[i].body.replace(url, newUrl);

          if (posts[i].body_abstract)
            posts[i].body_abstract = posts[i].body_abstract.replace(url, newUrl);
        }

        console.log('  - Post does not exist. Writing: ' + postPath + file);

        fs.writeFile(postPath+file, front + posts[i].body, function(err) {
            if(err) {
                console.log('FILE SAVE FAILURE: ', console.log(err));
                process.exit(1);
            }
        });
        var abstract = posts[i].body_abstract ? posts[i].body_abstract : posts[i].body;
        fs.writeFile(summaryPath+file, front + abstract, function(err) {
            if(err) {
                console.log('FILE SAVE FAILURE: ', console.log(err));
                process.exit(1);
            }
        });
      }
      console.log(' ');
    }
    if (posts.length == 20) getPosts(offset + 20);
  });
}

var copyImageToS3 = function(fromUrl, toPath) {

  var request2 = require('request').defaults({ encoding: null });

  request2.get(fromUrl, function (err, res, buffer) {

    var s3   = new AWS.S3();

    params   = {
      Bucket: awsEnv.get('s3_bucket').trim(),
      Key: toPath,
      ACL: 'public-read',
      Body: buffer,
      ContentType: res.headers['content-type']
    }

    s3.upload(params, function(err, data) {
        if (err) {
            console.log('AMAZON S3 UPLOAD FAILED: ', toPath);
            return console.log(err);
        }
    });
  });
}

var safeQuote = function(str) {
  return str.replace(/\'/g, '\'\'')
}

console.log('Syncing Tumblr posts to this project.');
getPosts(0);


