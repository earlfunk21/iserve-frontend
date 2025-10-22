import React, { useEffect, useRef } from "react";
import type { ManagerOptions, Socket, SocketOptions } from "socket.io-client";
import { io } from "socket.io-client";
import { create } from "zustand";

type SocketStore = {
  socketRef: { current: Socket | null };
  connected: boolean;
  connect: (
    url: string,
    opts?: Partial<ManagerOptions & SocketOptions>
  ) => void;
  disconnect: () => void;
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, cb: (...args: any[]) => void) => void;
  off: (event: string, cb?: (...args: any[]) => void) => void;
};

export const useSocketStore = create<SocketStore>((set, get) => ({
  socketRef: { current: null },
  connected: false,

  connect: (url, opts = {}) => {
    // If already connected, no-op
    if (get().socketRef.current) return;

    // Prefer websocket transport on React Native / Expo
    const socket: Socket = io(url, {
      transports: ["websocket"],
      // pass auth/token in opts.auth or opts.query
      ...opts,
      // optional reconnection options can be added here
      // reconnection: true,
      // reconnectionAttempts: 5,
      // reconnectionDelay: 1000,
    });

    socket.on("connect", () => set({ connected: true }));
    socket.on("disconnect", () => set({ connected: false }));

    // store instance in ref so we don't trigger re-renders when instance changes
    get().socketRef.current = socket;
  },

  disconnect: () => {
    const s = get().socketRef.current;
    if (!s) return;
    s.disconnect();
    get().socketRef.current = null;
    set({ connected: false });
  },

  emit: (event, ...args) => {
    const s = get().socketRef.current;
    s?.emit(event, ...args);
  },

  on: (event, cb) => {
    const s = get().socketRef.current;
    s?.on(event, cb);
  },

  off: (event, cb?) => {
    const s = get().socketRef.current;
    if (!s) return;
    if (cb) s.off(event, cb);
    else s.removeAllListeners(event);
  },
}));

export function useSocketEvent<T = any>(
  event: string,
  handler: (...args: T[]) => void,
  enabled = true
) {
  const socketRef = useSocketStore((s) => s.socketRef);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;
    const socket = socketRef.current;
    if (!socket) return;

    const wrapped = (...args: T[]) => handlerRef.current(...args);
    socket.on(event, wrapped);
    return () => {
      socket.off(event, wrapped);
    };
  }, [event, socketRef, enabled]);
}



/** Example usage of creating of Provider

type Props = {
  url: string;
  opts?: { auth?: Record<string, any>; query?: Record<string, any> };
  children?: React.ReactNode;
};

export function SocketProvider({ url, opts, children }: Props) {
  const connect = useSocketStore((s) => s.connect);
  const disconnect = useSocketStore((s) => s.disconnect);

  useEffect(() => {
    connect(url, opts);
    return () => {
      disconnect();
    };
  }, [url]);

  return children;
}
*/

/**
import { useSocketStore } from './createSocketStore'
import { useSocketEvent } from './useSocketEvent'

export default function ChatMessages() {
  const connected = useSocketStore((s) => s.connected)

  // handler runs whenever "message" arrives; useSocketEvent will cleanup automatically
  useSocketEvent<{ id: string; text: string }>('message', (msg) => {
    setMessages((prev) => [...prev, msg])
  }, connected) // only enabled when connected === true

  return (
    <div>
      <p>Connected: {connected ? 'yes' : 'no'}</p>
    </div>
  )
}
 */