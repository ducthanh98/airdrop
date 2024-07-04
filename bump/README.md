# How to Create and Fill `query.txt` with `user_id`

For this subproject, you only need to extract the `user_id` from the `query_id` and save it in `query.txt`.

## Steps:

1. **Find `query_id` in Session Storage**:
   - Follow the instructions in the [main README](../README.md#6-locate-the-query_id) to locate the `query_id` string in Web Telegram's session storage.

2. **Extract `user_id`**:
   - From the `query_id` string, look for the part that contains `user=%7B%22id%22%3A<user_id>%2C%`.
   - Extract the number between `%22id%22%3A` and `%2C%`. For example, if the string is `query_id=...&user=%7B%22id%22%3A595123123%2C%`, the `user_id` is `595123123`.

3. **Save `user_id` in `query.txt`**:
   - Open a text editor.
   - Create a new file named `query.txt`.
   - Paste the `user_id` into the file.
   - Save the file.

### Example `query.txt` File

```txt
595123123
