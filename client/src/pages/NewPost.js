import { Link } from "react-router-dom";
import { useMutation } from "@apollo/client";
import React, { useState } from "react";

import { AddPost } from "../graphql/mutations";
import { PostFields } from "../graphql/fragments";

function NewPost() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [completedMessage, setCompletedMessage] = useState("");

  const [addPost] = useMutation(AddPost, {
    update(cache, { data: { addPost } }) {
      cache.modify({
        fields: {
          posts(existingPosts = []) {
            const newPostRef = cache.writeFragment({
              data: addPost,
              fragment: PostFields
            });
            return [...existingPosts, newPostRef];
          }
        }
      });
    },
    onCompleted() {
      setContent("");
      setTitle("");
      setCompletedMessage("Your post was published!");
    }
  });

  return (
    <div>
      <h1>Add a New Post</h1>
      <form
        onSubmit={event => {
          event.preventDefault();
          setCompletedMessage("");
          addPost({ variables: { authorID: 1, content, title } });
        }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Title
            <input
              type="text"
              name="title"
              onChange={event => setTitle(event.target.value)}
              style={{ marginLeft: "1rem" }}
              value={title}
            />
          </label>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Content
            <textarea
              name="content"
              onChange={event => setContent(event.target.value)}
              style={{ marginLeft: "1rem" }}
              value={content}
            />
          </label>
        </div>
        <input type="submit" value="Submit" />
        {completedMessage && (
          <p>
            {completedMessage}. <Link to="/">View posts &rarr;</Link>
          </p>
        )}
      </form>
    </div>
  );
}

export default NewPost;
