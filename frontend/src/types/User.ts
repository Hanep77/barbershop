export interface User {
      id?: string;
      name: string;
      role: "customer" | "barbershop";
      email: string;
}

export interface Session {
      token: string;
      user: User;
}
