export interface Text {
  created_at: string,
  content: string,
}


export interface User {
  user_id: number,
  username: string,
  texts_count: number,
  created_at: string,
}