export interface Specialist {
  id: string;
  name: string;
  role: string;
  image: string;
  description: string;
  availability: string[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
}