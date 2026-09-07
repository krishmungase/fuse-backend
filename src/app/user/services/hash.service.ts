import bcrypt from "bcrypt";

class HashService {
  private readonly saltRounds = 10;

  async hashData(data: string): Promise<string> {
    return bcrypt.hash(data, this.saltRounds);
  }

  async hashCompare(data: string, hashData: string): Promise<boolean> {
    return bcrypt.compare(data, hashData);
  }
}

export default HashService;
