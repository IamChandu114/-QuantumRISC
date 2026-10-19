`timescale 1ns / 1ps

module alu(

    input  logic [31:0] a,
    input  logic [31:0] b,
    input  logic [3:0]  alu_control,

    output logic [31:0] result,
    output logic        zero

);

always @* begin

    case(alu_control)

        4'b0000: result = a + b;               // ADD
        4'b0001: result = a - b;               // SUB
        4'b0010: result = a & b;               // AND
        4'b0011: result = a | b;               // OR
        4'b0100: result = a ^ b;               // XOR
        4'b0101: result = a << b[4:0];         // SLL
        4'b0110: result = a >> b[4:0];         // SRL
        4'b0111: result = ($signed(a) < $signed(b)) ? 32'd1 : 32'd0; // SLT

        default: result = 32'd0;

    endcase

end

assign zero = (result == 32'd0);

endmodule