export type MyRooms = {
  unread: number;
  room: {
    id: string;
    updatedAt: Date;
    messages: {
      content: string;
    }[];
    participants: {
      user: {
        name: string;
        id: string;
        publicKey: string | null;
      };
    }[];
  };
};

export type Message = {
  id: string;
  createdAt: Date;
  content: string;
  sender: {
    name: string;
    id: string;
    publicKey: string;
  };
};

export type MyContact = {
  id: string;
  name: string;
  image: string;
  publicKey: string;
};

export type MyReferral = {
  id: string;
  name: string;
  image: string;
  publicKey: string;
};


export type RoomUser = {
  id: string;
  name: string;
  publicKey: string;
}
